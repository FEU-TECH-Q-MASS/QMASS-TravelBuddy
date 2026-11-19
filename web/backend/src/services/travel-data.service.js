const { getTravelConditions } = require("./travelConditionsService");

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Provider request failed with status ${response.status}.`);
  return response.json();
}

const destinationNames = { MNL: "Manila, Philippines", CEB: "Cebu, Philippines", DGT: "Dumaguete, Philippines", PPS: "Puerto Princesa, Palawan, Philippines", USU: "Coron, Palawan, Philippines", TAC: "Tacloban, Philippines", LAO: "Laoag, Philippines", PAL: "Palawan, Philippines", BOH: "Bohol, Philippines", BOR: "Boracay, Philippines", BAN: "Banaue, Philippines" };
const flightDestinations = { PAL: "PPS", BOH: "TAG", BOR: "MPH" };

async function searchDuffelFlights(trip) {
  if (!process.env.DUFFEL_ACCESS_TOKEN) return { provider: "unconfigured", offers: [] };
  const origin = trip.origin;
  const destination = flightDestinations[trip.destination] || trip.destination;
  if (!origin || !destination || destination === "BAN") return { provider: "unavailable", offers: [] };
  const passengers = Array.from({ length: Math.max(1, Number(trip.travelers) || 1) }, () => ({ type: "adult" }));
  const slices = [{ origin, destination, departure_date: trip.departure }];
  if (trip.returnDate) slices.push({ origin: destination, destination: origin, departure_date: trip.returnDate });
  const result = await jsonRequest("https://api.duffel.com/air/offer_requests", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "Duffel-Version": "v2", Authorization: `Bearer ${process.env.DUFFEL_ACCESS_TOKEN}` },
    body: JSON.stringify({ data: { slices, passengers, cabin_class: "economy", max_connections: 1 } }),
  });
  const offers = result.data?.offers || [];
  return { provider: "duffel", offers: offers.slice(0, 10).map((offer) => { const segment = offer.slices?.[0]?.segments?.[0]; const airline = segment?.operating_carrier?.name || segment?.marketing_carrier?.name || "Airline"; return { id: offer.id, route: `${origin} → ${destination}`, airline, fare: Number(offer.total_amount || 0), currency: offer.total_currency || trip.currency, availability: offer.live_mode ? "Live offer" : "Test offer", baggage: "Check fare rules", mandatoryCharges: "Included in provider total", quotedAt: new Date().toISOString(), expiresAt: offer.expires_at, details: offer.slices }; }) };
}

async function searchGoogleHotels(trip) {
  if (!process.env.GOOGLE_MAPS_API_KEY) return { provider: "unconfigured", offers: [] };
  const destination = destinationNames[String(trip.destination || "").toUpperCase()] || trip.destination;
  const result = await jsonRequest("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.googleMapsUri" },
    body: JSON.stringify({ textQuery: `hotels in ${destination}`, languageCode: "en", regionCode: "PH", maxResultCount: 5 }),
  });
  return { provider: "google-places", offers: (result.places || []).map((place) => ({ id: place.id, name: place.displayName?.text || "Hotel", location: place.formattedAddress || destination, guests: trip.travelers, nightlyRate: null, totalStay: null, currency: trip.currency, availability: "Price and availability must be checked with the provider", taxesAndFees: "Not provided by Google Places", googleMapsUri: place.googleMapsUri, quotedAt: new Date().toISOString() })) };
}

function sampleFlights(trip) {
  return [{ id: `sample-flight-${trip.id}`, route: `${trip.origin} → ${trip.destination}`, airline: "Sample airline", fare: 8500, currency: trip.currency, availability: "Sample estimate — live provider unavailable", baggage: "Check airline rules", mandatoryCharges: "Illustrative only", quotedAt: new Date().toISOString(), sample: true }];
}

function sampleHotels(trip) {
  const destination = destinationNames[String(trip.destination || "").toUpperCase()] || trip.destination;
  const nights = Math.max(1, Math.round((new Date(`${trip.returnDate}T00:00:00Z`) - new Date(`${trip.departure}T00:00:00Z`)) / 86400000));
  return [{ id: `sample-hotel-${trip.id}`, name: `${destination} sample stay`, location: destination, guests: trip.travelers, nightlyRate: 3500, totalStay: nights * 3500, currency: trip.currency, availability: "Sample estimate — live provider unavailable", taxesAndFees: "Illustrative only", quotedAt: new Date().toISOString(), sample: true }];
}

async function refreshTravelData(trip) {
  const [flightResult, hotelResult, conditions] = await Promise.all([
    searchDuffelFlights(trip),
    searchGoogleHotels(trip),
    getTravelConditions(trip),
  ].map((request) => request.catch(() => null)));
  const flights = flightResult?.offers?.length ? flightResult : { provider: "sample", offers: sampleFlights(trip) };
  const hotels = hotelResult?.offers?.length ? hotelResult : { provider: "sample", offers: sampleHotels(trip) };
  return {
    offers: { flights: flights.offers, hotels: hotels.offers },
    conditions: conditions || trip.conditions,
    providers: { flights: flights.provider, hotels: hotels.provider },
  };
}

module.exports = { refreshTravelData };
