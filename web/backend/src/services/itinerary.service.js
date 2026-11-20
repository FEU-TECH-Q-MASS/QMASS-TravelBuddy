const crypto = require("node:crypto");
const { destinationLocation } = require("../../../shared/destinations.cjs");
const { dayMs, validateTripDates } = require("../../../shared/tripDates.cjs");
const { venueKinds, resolveItineraryVenues } = require("./itinerary-venues.service");

const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const kinds = Object.keys(venueKinds);
const responseJsonSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["date", "activities"],
    properties: {
      date: { type: "string", format: "date" },
      activities: { type: "array", minItems: 1, maxItems: 6, items: {
        type: "object",
        required: ["time", "kind", "durationMinutes", "cost"],
        properties: {
          time: { type: "string" },
          kind: { type: "string", enum: kinds },
          durationMinutes: { type: "integer", minimum: 15, maximum: 480 },
          cost: { type: "number", minimum: 0 },
        },
      } },
    },
  },
};

function extractJson(text) {
  const cleaned = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start < 0 || end < start) throw new Error("The AI response did not contain a JSON itinerary.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function validateItinerary(value, trip) {
  const { errors, nights } = validateTripDates(trip.departure, trip.returnDate);
  if (Object.keys(errors).length || !Array.isArray(value) || value.length !== nights + 1) {
    throw new Error("The AI itinerary did not cover the selected trip dates.");
  }
  const start = Date.parse(`${trip.departure}T00:00:00Z`);
  return value.map((day, dayIndex) => {
    if (!day || !Array.isArray(day.activities) || day.activities.length < 1 || day.activities.length > 6) throw new Error(`Day ${dayIndex + 1} is incomplete.`);
    const date = new Date(start + dayIndex * dayMs).toISOString().slice(0, 10);
    if (day.date !== date) throw new Error(`The AI itinerary did not include the expected date ${date}.`);
    let previousTime = "";
    return { day: dayIndex + 1, date, activities: day.activities.map((activity) => {
      if (!activity || !kinds.includes(activity.kind) || typeof activity.time !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(activity.time) ||
          activity.time <= previousTime || !Number.isInteger(activity.durationMinutes) ||
          activity.durationMinutes < 15 || activity.durationMinutes > 480 ||
          !Number.isFinite(activity.cost) || activity.cost < 0) {
        throw new Error(`Day ${dayIndex + 1} has an invalid activity.`);
      }
      previousTime = activity.time;
      const kind = venueKinds[activity.kind];
      return {
        id: `activity_${crypto.randomUUID()}`,
        time: activity.time,
        title: kind.title,
        venueKind: activity.kind,
        ...(kind.isOutdoor === undefined ? {} : { isOutdoor: kind.isOutdoor }),
        durationMinutes: activity.durationMinutes,
        cost: kind.type && kind.type !== "restaurant" ? activity.cost : 0,
      };
    }) };
  });
}

async function generateItinerary(trip) {
  if (!process.env.GEMINI_API_KEY) return { itinerary: trip.itinerary, provider: "demo-fallback", model: null, generatedAt: new Date().toISOString() };
  const { activities, remaining } = trip.budgetBreakdown;
  const activityBudget = Math.max(0, Math.round(remaining * 100) + Math.round(activities * 100)) / 100;
  const prompt = `Create a practical itinerary of activity categories. The backend will select venues. Return one item per calendar date from departure through return. Use increasing 24-hour HH:MM times and allow time between stops. Choose categories suited to the destination, trip interests, and length. Provide estimated activity fees per traveler in ${trip.currency}; meals and free time have zero activity cost. The activity budget is for the entire group across all days after airfare, lodging, meals, and transport. Trip: ${JSON.stringify({ destination: destinationLocation(trip.destination), departure: trip.departure, returnDate: trip.returnDate, travelers: trip.travelers, activityBudget, currency: trip.currency, interests: trip.interests || [] })}`;
  const signal = AbortSignal.timeout(25000);
  let lastError;
  let itinerary;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response;
    try {
      const text = attempt ? `${prompt}\nThe previous response failed validation. Check every date, time, and required field.` : prompt;
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text }] }], generationConfig: { temperature: 0.3, responseMimeType: "application/json", responseJsonSchema } }),
        signal,
      });
      if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}.`);
      const payload = await response.json();
      const content = payload.candidates?.[0]?.content?.parts?.filter((part) => !part.thought).map((part) => part.text || "").join("");
      itinerary = validateItinerary(extractJson(content), trip);
      if (itinerary.every((day) => day.activities.every(({ venueKind }) => venueKind === "free_time"))) {
        itinerary = undefined;
        throw new Error("The AI itinerary did not suggest any places to visit.");
      }
      break;
    } catch (error) {
      lastError = error;
      if (signal.aborted || (response && !response.ok && ![429, 500, 502, 503, 504].includes(response.status))) break;
    }
    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 750));
  }
  if (!itinerary) throw lastError;
  const resolved = await resolveItineraryVenues(itinerary, trip);
  const venueLookup = resolved.some(({ activities }) => activities.some(({ placeId, venueSource }) => placeId || venueSource));
  return { itinerary: resolved, provider: "google-gemini", venueLookup, model, generatedAt: new Date().toISOString() };
}

module.exports = { generateItinerary };
