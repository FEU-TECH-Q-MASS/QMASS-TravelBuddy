const crypto = require("node:crypto");

const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

function extractJson(text) {
  const cleaned = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start < 0 || end < start) throw new Error("The AI response did not contain a JSON itinerary.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function validateItinerary(value, trip) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 14) throw new Error("The AI itinerary contained an invalid number of days.");
  return value.map((day, dayIndex) => {
    if (!day || !Array.isArray(day.activities) || day.activities.length < 1 || day.activities.length > 8) throw new Error(`Day ${dayIndex + 1} is incomplete.`);
    return { day: dayIndex + 1, date: day.date || trip.itinerary[dayIndex]?.date, activities: day.activities.map((activity, activityIndex) => {
      if (!activity || typeof activity.title !== "string" || !activity.title.trim()) throw new Error(`Day ${dayIndex + 1} has an invalid activity.`);
      return { id: `activity_${crypto.randomUUID()}`, time: typeof activity.time === "string" ? activity.time.slice(0, 20) : `${String(9 + activityIndex * 3).padStart(2, "0")}:00`, title: activity.title.trim().slice(0, 180), durationMinutes: Number.isFinite(Number(activity.durationMinutes)) ? Math.max(15, Math.min(480, Number(activity.durationMinutes))) : 90, cost: Number.isFinite(Number(activity.cost)) ? Math.max(0, Number(activity.cost)) : 0, travelMinutesFromPrevious: Number.isFinite(Number(activity.travelMinutesFromPrevious)) ? Math.max(0, Number(activity.travelMinutesFromPrevious)) : 0, distanceKmFromPrevious: Number.isFinite(Number(activity.distanceKmFromPrevious)) ? Math.max(0, Number(activity.distanceKmFromPrevious)) : 0 };
    }) };
  });
}

async function generateItinerary(trip) {
  if (!process.env.GEMINI_API_KEY) return { itinerary: trip.itinerary, provider: "demo-fallback", model: null, generatedAt: new Date().toISOString() };
  const prompt = `Create a practical daily travel itinerary as JSON for this trip. Return ONLY a JSON array, with no markdown. Each item must have date and activities. Each activity must have time, title, durationMinutes, cost in ${trip.currency}, travelMinutesFromPrevious, and distanceKmFromPrevious. Do not invent bookings or claim live availability. Keep costs realistic estimates and fit the total budget. Trip: ${JSON.stringify({ destination: trip.destination, departure: trip.departure, returnDate: trip.returnDate, travelers: trip.travelers, budget: trip.budget, currency: trip.currency, interests: trip.interests || [] })}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, responseMimeType: "application/json" } }), signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}.`);
  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("");
  return { itinerary: validateItinerary(extractJson(text), trip), provider: "google-gemini", model, generatedAt: new Date().toISOString() };
}

module.exports = { generateItinerary };
