const { getTravelConditions } = require("./travelConditionsService");

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

const destinationNames = { MNL: "Manila, Philippines", CEB: "Cebu, Philippines", DGT: "Dumaguete, Philippines", PPS: "Puerto Princesa, Palawan, Philippines", USU: "Coron, Palawan, Philippines", TAC: "Tacloban, Philippines", LAO: "Laoag, Philippines", PAL: "Palawan, Philippines", BOH: "Bohol, Philippines", BOR: "Boracay, Philippines", BAN: "Banaue, Philippines" };
const airportNames = { MNL: "Manila", CEB: "Cebu", DGT: "Dumaguete", PPS: "Puerto Princesa", USU: "Busuanga", TAC: "Tacloban", LAO: "Laoag" };

function sampleFlights(trip) {
  const origin = airportNames[trip.origin] || trip.origin;
  const destination = destinationNames[trip.destination] || trip.destination;
  return [{ id: `sample-flight-${trip.id}`, route: `${origin} → ${destination}`, airline: "Philippine Airlines", fare: 8500, currency: trip.currency, availability: "Check availability", baggage: "Check airline rules", mandatoryCharges: "See provider details", quotedAt: new Date().toISOString(), sample: true }];
}

function sampleHotels(trip) {
  const destination = destinationNames[String(trip.destination || "").toUpperCase()] || trip.destination;
  const nights = Math.max(1, Math.round((new Date(`${trip.returnDate}T00:00:00Z`) - new Date(`${trip.departure}T00:00:00Z`)) / 86400000));
  return [{ id: `sample-hotel-${trip.id}`, name: `${destination.split(",")[0]} Harbor Hotel`, location: destination, guests: trip.travelers, nightlyRate: 3500, totalStay: nights * 3500, currency: trip.currency, availability: "Check availability", taxesAndFees: "See provider details", quotedAt: new Date().toISOString(), sample: true }];
}

async function generatePrototypeOffers(trip) {
  if (!process.env.GEMINI_API_KEY) return { provider: "sample", flights: sampleFlights(trip), hotels: sampleHotels(trip) };
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const prompt = `Create prototype travel options as JSON only. These are fictional estimates for a UI prototype, not live inventory and not bookable. Never claim live availability. Return {"flights":[{"route":string,"airline":string,"fare":number,"currency":string,"stops":string}],"hotels":[{"name":string,"location":string,"nightlyRate":number,"totalStay":number,"currency":string,"style":string}]}. Trip: ${JSON.stringify({ origin: trip.origin, destination: trip.destination, departure: trip.departure, returnDate: trip.returnDate, travelers: trip.travelers, currency: trip.currency, budget: trip.budget })}`;
  const response = await jsonRequest(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, responseMimeType: "application/json" } }) });
  const generated = extractJson(response.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join(""));
  const flights = (Array.isArray(generated.flights) ? generated.flights : []).slice(0, 5).map((item, index) => ({ id: `ai-flight-${trip.id}-${index}`, route: item.route || `${trip.origin} → ${trip.destination}`, airline: item.airline || "Airline", fare: Number(item.fare) || 0, currency: item.currency || trip.currency, availability: "Check availability", baggage: item.stops || "Check airline rules", mandatoryCharges: "See provider details", quotedAt: new Date().toISOString(), sample: true }));
  const hotels = (Array.isArray(generated.hotels) ? generated.hotels : []).slice(0, 5).map((item, index) => ({ id: `ai-hotel-${trip.id}-${index}`, name: item.name || "Hotel", location: item.location || trip.destination, guests: trip.travelers, nightlyRate: Number(item.nightlyRate) || 0, totalStay: Number(item.totalStay) || 0, currency: item.currency || trip.currency, availability: "Check availability", taxesAndFees: "See provider details", quotedAt: new Date().toISOString(), sample: true }));
  return { provider: "gemini-prototype", flights: flights.length ? flights : sampleFlights(trip), hotels: hotels.length ? hotels : sampleHotels(trip) };
}

async function refreshTravelData(trip) {
  const [options, conditions] = await Promise.all([
    generatePrototypeOffers(trip).catch(() => ({ provider: "sample", flights: sampleFlights(trip), hotels: sampleHotels(trip) })),
    getTravelConditions(trip).catch(() => null),
  ]);
  return { offers: { flights: options.flights, hotels: options.hotels }, conditions: conditions || trip.conditions, providers: { flights: options.provider, hotels: options.provider } };
}

module.exports = { refreshTravelData };
