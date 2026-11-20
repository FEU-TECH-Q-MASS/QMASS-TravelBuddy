const crypto = require("node:crypto");
const { destinationLocation } = require("../../../shared/destinations.cjs");
const { dayMs, validateTripDates } = require("../../../shared/tripDates.cjs");

const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

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
    if (!day || !Array.isArray(day.activities) || day.activities.length < 1 || day.activities.length > 8) throw new Error(`Day ${dayIndex + 1} is incomplete.`);
    const date = new Date(start + dayIndex * dayMs).toISOString().slice(0, 10);
    if (day.date !== date) throw new Error(`The AI itinerary did not include the expected date ${date}.`);
    return { day: dayIndex + 1, date, activities: day.activities.map((activity, activityIndex) => {
      if (!activity || typeof activity.title !== "string" || !activity.title.trim()) throw new Error(`Day ${dayIndex + 1} has an invalid activity.`);
      if (!Number.isFinite(activity.cost) || activity.cost < 0) throw new Error(`Day ${dayIndex + 1} has an invalid activity cost.`);
      return {
        id: `activity_${crypto.randomUUID()}`,
        time: typeof activity.time === "string" ? activity.time.slice(0, 20) : `${String(9 + activityIndex * 3).padStart(2, "0")}:00`,
        title: activity.title.trim().slice(0, 180),
        location: typeof activity.location === "string" && activity.location.trim() ? activity.location.trim().slice(0, 180) : destinationLocation(trip.destination),
        durationMinutes: Number.isFinite(Number(activity.durationMinutes)) ? Math.max(15, Math.min(480, Number(activity.durationMinutes))) : 90,
        cost: activity.cost,
      };
    }) };
  });
}

async function generateItinerary(trip) {
  if (!process.env.GEMINI_API_KEY) return { itinerary: trip.itinerary, provider: "demo-fallback", model: null, generatedAt: new Date().toISOString() };
  const { activities, remaining } = trip.budgetBreakdown;
  const activityBudget = Math.max(0, Math.round(remaining * 100) + Math.round(activities * 100)) / 100;
  const prompt = `Create a practical daily travel itinerary as JSON. Return only a JSON array, with one item per calendar date from departure through return, in order. Each item must contain date (YYYY-MM-DD) and activities. Each activity must contain time, title, location, durationMinutes, and a numeric cost per traveler in ${trip.currency}. The activity budget is the maximum for the whole group across all days after estimated airfare, lodging, meals, and transport. Prefer free or low-cost places where needed and include required activity fees in the estimate. The location must be a real, searchable place near the destination in the Philippines, with enough detail for Google Maps to identify it. Vary places and activities based on the trip interests. Do not claim live pricing or availability. Trip: ${JSON.stringify({ destination: destinationLocation(trip.destination), departure: trip.departure, returnDate: trip.returnDate, travelers: trip.travelers, activityBudget, currency: trip.currency, interests: trip.interests || [] })}`;
  const request = {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, responseMimeType: "application/json" } }),
    signal: AbortSignal.timeout(30000),
  };
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, request);
      if (!response.ok) {
        lastError = new Error(`Gemini request failed with status ${response.status}.`);
        if (![429, 500, 502, 503, 504].includes(response.status)) throw lastError;
      } else {
        const payload = await response.json();
        const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("");
        return { itinerary: validateItinerary(extractJson(text), trip), provider: "google-gemini", model, generatedAt: new Date().toISOString() };
      }
    } catch (error) {
      lastError = error;
      if (error.name !== "AbortError" && !/fetch failed/i.test(error.message || "")) throw error;
    }
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 750 * (attempt + 1)));
  }
  console.warn(`Gemini unavailable after retries; using the generated local itinerary. ${lastError?.message || ""}`);
  return { itinerary: trip.itinerary, provider: "local-fallback", model: null, generatedAt: new Date().toISOString() };
}

module.exports = { generateItinerary };
