const amadeusBase = (process.env.AMADEUS_BASE_URL || "https://test.api.amadeus.com").replace(/\/$/, "");
const weatherKey = process.env.OPENWEATHER_API_KEY;
const holidayBase = (process.env.NAGER_DATE_BASE_URL || "https://date.nager.at/api/v3").replace(/\/$/, "");
let amadeusToken;

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Provider request failed with status ${response.status}.`);
  return response.json();
}
async function getAmadeusToken() {
  if (amadeusToken?.expiresAt > Date.now()) return amadeusToken.value;
  const body = new URLSearchParams({ grant_type: "client_credentials", client_id: process.env.AMADEUS_CLIENT_ID || "", client_secret: process.env.AMADEUS_CLIENT_SECRET || "" });
  const result = await jsonRequest(`${amadeusBase}/v1/security/oauth2/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  amadeusToken = { value: result.access_token, expiresAt: Date.now() + (result.expires_in - 30) * 1000 };
  return amadeusToken.value;
}
async function amadeus(path, params) { const token = await getAmadeusToken(); return jsonRequest(`${amadeusBase}${path}?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${token}` } }); }

async function searchFlights(trip) {
  if (!process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET || !trip.origin) return { provider: "demo", offers: trip.offers.flights };
  const result = await amadeus("/v2/shopping/flight-offers", { originLocationCode: trip.origin, destinationLocationCode: trip.destination, departureDate: trip.departure, adults: trip.travelers, currencyCode: trip.currency, max: 5 });
  return { provider: "amadeus", offers: (result.data || []).map((offer) => ({ id: offer.id, route: `${trip.origin} → ${trip.destination}`, airline: offer.validatingAirlineCodes?.join(", "), fare: Number(offer.price?.grandTotal || 0), currency: offer.price?.currency || trip.currency, availability: `${offer.numberOfBookableSeats || "Limited"} seats`, baggage: offer.travelerPricings?.[0]?.fareDetailsBySegment?.map((item) => item.includedCheckedBags?.quantity ? `${item.includedCheckedBags.quantity} checked bag(s)` : "Carry-on only").join(", ") || "Check fare rules", mandatoryCharges: "Included in quoted total", quotedAt: new Date().toISOString(), details: offer.itineraries })) };
}
async function searchHotels(trip) {
  if (!process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET) return { provider: "demo", offers: trip.offers.hotels };
  const result = await amadeus("/v3/shopping/hotel-offers", { cityCode: trip.destination, checkInDate: trip.departure, checkOutDate: trip.returnDate, adults: trip.travelers, roomQuantity: 1, currency: trip.currency });
  return { provider: "amadeus", offers: (result.data || []).slice(0, 5).map((item) => { const offer = item.offers?.[0]; return { id: offer?.id || item.hotel?.hotelId, name: item.hotel?.name, location: item.hotel?.address?.lines?.join(", ") || trip.destination, guests: trip.travelers, nightlyRate: Number(offer?.price?.variations?.average?.base || offer?.price?.base || 0), totalStay: Number(offer?.price?.total || 0), currency: offer?.price?.currency || trip.currency, availability: "Available from provider", taxesAndFees: offer?.price?.taxes?.map((tax) => tax.description).join(", ") || "See provider rate rules", quotedAt: new Date().toISOString(), details: offer }; }) };
}
async function getConditions(trip) {
  const year = new Date(trip.departure).getUTCFullYear();
  const conditions = { weather: "Weather unavailable for this destination.", holidays: "Public holiday data unavailable.", seasonalContext: "Seasonal context is an estimate.", sourceTimestamp: new Date().toISOString(), forecastAvailable: false, providers: [] };
  if (weatherKey && trip.latitude && trip.longitude) { const weather = await jsonRequest(`https://api.openweathermap.org/data/2.5/forecast?lat=${trip.latitude}&lon=${trip.longitude}&appid=${weatherKey}&units=metric`); conditions.weather = weather.list?.slice(0, 3).map((item) => `${item.dt_txt}: ${item.weather?.[0]?.description}, ${item.main?.temp}°C`).join("; ") || conditions.weather; conditions.forecastAvailable = true; conditions.providers.push("OpenWeather"); }
  const holidays = await jsonRequest(`${holidayBase}/PublicHolidays/${year}/${trip.countryCode || "PH"}`).catch(() => []); const relevant = holidays.filter((item) => item.date >= trip.departure && item.date <= trip.returnDate); if (relevant.length) conditions.holidays = relevant.map((item) => `${item.date}: ${item.localName}`).join("; "); conditions.providers.push("Nager.Date"); return conditions;
}
async function refreshTravelData(trip) { const [flights, hotels, conditions] = await Promise.all([searchFlights(trip), searchHotels(trip), getConditions(trip)]); return { offers: { flights: flights.offers, hotels: hotels.offers }, conditions, providers: { flights: flights.provider, hotels: hotels.provider } }; }
module.exports = { refreshTravelData };
