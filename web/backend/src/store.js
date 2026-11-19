const crypto = require("node:crypto");

const users = new Map();
const sessions = new Map();
const trips = new Map();
const notifications = new Map();
const resetTokens = new Map();
const priceTrackers = new Map();

function id(prefix) { return `${prefix}_${crypto.randomUUID()}`; }
function seed() {
  if (users.size) return;
  const user = { id: "user_demo", name: "Demo Traveler", email: "demo@travelbuddy.test", passwordHash: crypto.scryptSync("demo1234", "travelbuddy-demo-salt", 64).toString("hex"), role: "admin", active: true, preferences: { currency: "PHP", interests: ["Nature", "Food"] }, createdAt: new Date().toISOString() };
  users.set(user.id, user);
}
seed();

function publicUser(user) { const safe = { ...user }; delete safe.password; delete safe.passwordHash; return safe; }
function makeItinerary(input) {
  const start = new Date(`${input.departure}T00:00:00Z`);
  const end = new Date(`${input.returnDate}T00:00:00Z`);
  const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
  const interests = input.interests?.length ? input.interests : ["Explore"];
  return Array.from({ length: Math.min(days, 14) }, (_, index) => ({
    day: index + 1,
    date: new Date(start.getTime() + index * 86400000).toISOString().slice(0, 10),
    activities: [
      { id: id("activity"), time: "09:00", title: `${interests[index % interests.length]} morning in ${input.destination}`, durationMinutes: 120, cost: 500, travelMinutesFromPrevious: 0, distanceKmFromPrevious: 0 },
      { id: id("activity"), time: "13:00", title: "Local lunch and neighborhood walk", durationMinutes: 120, cost: 650, travelMinutesFromPrevious: 25, distanceKmFromPrevious: 3.2 },
      { id: id("activity"), time: "17:00", title: "Sunset viewpoint and free time", durationMinutes: 120, cost: 300, travelMinutesFromPrevious: 20, distanceKmFromPrevious: 2.4 },
    ],
  }));
}
function enrichTrip(input, ownerId) {
  const idValue = id("trip");
  const itinerary = makeItinerary(input);
  const nights = Math.max(0, itinerary.length - 1);
  const currency = input.currency || "PHP";
  const flight = input.includeFlights ? 12000 : 0;
  const hotel = nights * 3500;
  const activities = itinerary.reduce((sum, day) => sum + day.activities.reduce((daySum, activity) => daySum + activity.cost, 0), 0);
  const trip = { id: idValue, ownerId, ...input, travelers: Number(input.travelers), budget: Number(input.budget), currency, itinerary, offers: { flights: [{ id: id("flight"), route: `Manila → ${input.destination}`, airline: "TravelBuddy Demo Air", fare: flight || 8500, currency, availability: "Demo availability", baggage: "20 kg included", mandatoryCharges: "Included", quotedAt: new Date().toISOString() }], hotels: [{ id: id("hotel"), name: "TravelBuddy City Stay", location: input.destination, guests: Number(input.travelers), nightlyRate: 3500, totalStay: hotel, currency, availability: "Demo availability", taxesAndFees: "Included", quotedAt: new Date().toISOString() }] }, budgetBreakdown: { flights: flight, accommodation: hotel, activities, meals: itinerary.length * 900, transportation: itinerary.length * 500, estimatedTotal: flight + hotel + activities + itinerary.length * 1400, remaining: Number(input.budget) - (flight + hotel + activities + itinerary.length * 1400), currency }, conditions: { weather: "Demo forecast: warm with a chance of showers", holidays: "Check local public holidays before departure", seasonalContext: "Typical seasonal conditions", sourceTimestamp: new Date().toISOString(), forecastAvailable: false }, routes: itinerary.map((day) => ({ day: day.day, totalDistanceKm: day.activities.reduce((sum, activity) => sum + activity.distanceKmFromPrevious, 0), estimatedTravelMinutes: day.activities.reduce((sum, activity) => sum + activity.travelMinutesFromPrevious, 0), stops: day.activities.map((activity) => ({ title: activity.title, lat: 14.5995 + day.day / 100, lng: 120.9842 + day.day / 100 })) })), status: "ready", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  trips.set(idValue, trip);
  return trip;
}

function applyItinerary(trip, itinerary, generation) {
  const activities = itinerary.reduce((sum, day) => sum + day.activities.reduce((daySum, activity) => daySum + activity.cost, 0), 0);
  trip.itinerary = itinerary;
  trip.generation = generation;
  trip.budgetBreakdown.activities = activities;
  trip.budgetBreakdown.estimatedTotal = trip.budgetBreakdown.flights + trip.budgetBreakdown.accommodation + activities + trip.budgetBreakdown.meals + trip.budgetBreakdown.transportation;
  trip.budgetBreakdown.remaining = trip.budget - trip.budgetBreakdown.estimatedTotal;
  trip.routes = itinerary.map((day) => ({ day: day.day, totalDistanceKm: day.activities.reduce((sum, activity) => sum + activity.distanceKmFromPrevious, 0), estimatedTravelMinutes: day.activities.reduce((sum, activity) => sum + activity.travelMinutesFromPrevious, 0), stops: day.activities.map((activity, index) => ({ title: activity.title, lat: 14.5995 + day.day / 100 + index / 1000, lng: 120.9842 + day.day / 100 + index / 1000 })) }));
  trip.updatedAt = new Date().toISOString();
  return trip;
}

module.exports = { users, sessions, trips, notifications, resetTokens, priceTrackers, id, publicUser, enrichTrip, applyItinerary };
