const { destinationLocation } = require("../../../shared/destinations.cjs");
const { getTravelConditions } = require("./travelConditionsService");
const { getAllowances, priceHotelEstimates } = require("./trip-budget.service");

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`AI provider request failed with status ${response.status}.`);
  return response.json();
}

function extractJson(text) {
  const cleaned = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("AI travel options did not contain JSON.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function sampleHotels(trip) {
  const destination = destinationLocation(trip.destination);
  return [{ id: `sample-hotel-${trip.id}`, name: "Sample accommodation", location: destination, nightlyRate: getAllowances(trip.currency).room, currency: trip.currency, quotedAt: new Date().toISOString(), sample: true, source: "TravelBuddy sample" }];
}

async function generatePrototypeOffers(trip) {
  if (!process.env.GEMINI_API_KEY) return { provider: "sample", hotels: sampleHotels(trip) };
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const prompt = `Create illustrative hotel estimates as JSON only. These are prototype estimates, with no live availability or booking. Return {"hotels":[{"name":string,"location":string,"nightlyRate":number,"currency":string}]}. Nightly rates are for one room for up to two guests, in ${trip.currency}. Trip: ${JSON.stringify({ destination: destinationLocation(trip.destination), departure: trip.departure, returnDate: trip.returnDate })}`;
  const response = await jsonRequest(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, responseMimeType: "application/json" } }) });
  const generated = extractJson(response.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join(""));
  const hotels = (Array.isArray(generated.hotels) ? generated.hotels : [])
    .filter((item) => item?.currency === trip.currency && Number.isFinite(item.nightlyRate) && item.nightlyRate > 0 && Number.isSafeInteger(Math.round(item.nightlyRate * 100)))
    .slice(0, 5)
    .map((item, index) => ({
      id: `ai-hotel-${trip.id}-${index}`,
      name: typeof item.name === "string" && item.name.trim() ? item.name : "Sample accommodation",
      location: typeof item.location === "string" ? item.location : destinationLocation(trip.destination),
      nightlyRate: item.nightlyRate, currency: trip.currency,
      quotedAt: new Date().toISOString(), sample: true, source: "Gemini estimate",
    }));
  return hotels.length ? { provider: "gemini-prototype", hotels } : { provider: "sample", hotels: sampleHotels(trip) };
}

async function refreshTravelData(trip) {
  const [options, conditions] = await Promise.all([
    generatePrototypeOffers(trip).catch(() => ({ provider: "sample", hotels: sampleHotels(trip) })),
    getTravelConditions(trip).catch(() => null),
  ]);
  return {
    offers: { flights: [], hotels: priceHotelEstimates(trip, options.hotels) },
    conditions: conditions || trip.conditions,
    providers: { flights: "route-guidance", hotels: options.provider },
  };
}

module.exports = { refreshTravelData };
