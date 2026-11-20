const crypto = require("node:crypto");

const users = new Map();
const trips = new Map();
const notifications = new Map();
const priceTrackers = new Map();

function id(prefix) { return `${prefix}_${crypto.randomUUID()}`; }
function seed() {
  if (users.size) return;
  const user = { id: "user_demo", name: "Demo Traveler", email: "demo@travelbuddy.test", role: "admin", active: true, preferences: { currency: "PHP", interests: ["Nature", "Food"] }, createdAt: new Date().toISOString() };
  users.set(user.id, user);
}
seed();

function publicUser(user) { const safe = { ...user }; delete safe.password; delete safe.supabaseUser; return safe; }
function makeItinerary(input) {
  const start = new Date(`${input.departure}T00:00:00Z`);
  const end = new Date(`${input.returnDate}T00:00:00Z`);
  const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
  const plans = [
    ["Orientation walk and local breakfast", "Heritage district and cultural landmarks", "Sunset viewpoint and relaxed dinner"],
    ["Nature trail and scenic viewpoint", "Local market lunch and neighborhood walk", "Riverside or coastal evening"],
    ["Island or countryside excursion", "Regional food tasting", "Free afternoon and sunset cruise"],
    ["Adventure activity and morning coffee", "Museum or community experience", "Live music and local dinner"],
    ["Slow breakfast and hidden-gem discovery", "Handicraft shopping and lunch", "Farewell viewpoint and free time"],
  ];
  const localStops = {
    MNL: ["Intramuros, Manila", "Rizal Park, Manila", "Manila Baywalk"],
    CEB: ["Basilica Minore del Santo Niño, Cebu", "Magellan's Cross, Cebu", "Tops Cebu"],
    DGT: ["Rizal Boulevard, Dumaguete", "Silliman University, Dumaguete", "Casaroro Falls, Negros Oriental"],
    PPS: ["Puerto Princesa City Baywalk Park", "Baker's Hill, Puerto Princesa", "Honda Bay, Puerto Princesa"],
    USU: ["Coron Town, Palawan", "Maquinit Hot Spring, Coron", "Lualhati Park, Coron"],
    TAC: ["San Juanico Bridge", "MacArthur Landing Memorial National Park", "Santo Niño Shrine and Heritage Museum"],
    LAO: ["Laoag City Hall", "Paoay Church", "La Paz Sand Dunes, Ilocos Norte"],
    PAL: ["Puerto Princesa City Baywalk Park", "Baker's Hill, Puerto Princesa", "Honda Bay, Puerto Princesa"],
    BOH: ["Alona Beach, Panglao", "Hinagdanan Cave, Bohol", "Bohol Loboc River"],
    BOR: ["White Beach Station 2, Boracay", "D'Mall Boracay", "Willy's Rock, Boracay"],
    BAN: ["Banaue Viewpoint", "Banaue Museum", "Batad Rice Terraces"],
  }[String(input.destination || "").toUpperCase()] || [`${input.destination}, Philippines`];
  return Array.from({ length: Math.min(days, 14) }, (_, index) => ({
    day: index + 1,
    date: new Date(start.getTime() + index * 86400000).toISOString().slice(0, 10),
    activities: [
      { id: id("activity"), time: "09:00", title: `${plans[index % plans.length][0]} in ${input.destination}`, location: localStops[0], durationMinutes: 120, cost: 500 + index * 50, travelMinutesFromPrevious: 0, distanceKmFromPrevious: 0 },
      { id: id("activity"), time: "13:00", title: `${plans[index % plans.length][1]} in ${input.destination}`, location: localStops[1 % localStops.length], durationMinutes: 120, cost: 650 + index * 75, travelMinutesFromPrevious: 20 + index * 5, distanceKmFromPrevious: 2.4 + index * 0.6 },
      { id: id("activity"), time: "17:00", title: plans[index % plans.length][2], location: localStops[2 % localStops.length], durationMinutes: 120, cost: 300 + index * 40, travelMinutesFromPrevious: 15 + index * 5, distanceKmFromPrevious: 1.8 + index * 0.5 },
    ],
  }));
}
function enrichTrip(input, ownerId) {
  const idValue = crypto.randomUUID();
  const itinerary = makeItinerary(input);
  const nights = Math.max(0, itinerary.length - 1);
  const currency = input.currency || "PHP";
  const flight = input.includeFlights ? 12000 : 0;
  const hotel = nights * 3500;
  const activities = itinerary.reduce((sum, day) => sum + day.activities.reduce((daySum, activity) => daySum + activity.cost, 0), 0);
  const trip = { id: idValue, ownerId, ...input, travelers: Number(input.travelers), budget: Number(input.budget), currency, itinerary, offers: { flights: [{ id: id("flight"), route: `Manila → ${input.destination}`, airline: "TravelBuddy Demo Air", fare: flight || 8500, currency, availability: "Demo availability", baggage: "20 kg included", mandatoryCharges: "Included", quotedAt: new Date().toISOString() }], hotels: [{ id: id("hotel"), name: "TravelBuddy City Stay", location: input.destination, guests: Number(input.travelers), nightlyRate: 3500, totalStay: hotel, currency, availability: "Demo availability", taxesAndFees: "Included", quotedAt: new Date().toISOString() }] }, budgetBreakdown: { flights: flight, accommodation: hotel, activities, meals: itinerary.length * 900, transportation: itinerary.length * 500, estimatedTotal: flight + hotel + activities + itinerary.length * 1400, remaining: Number(input.budget) - (flight + hotel + activities + itinerary.length * 1400), currency }, conditions: { weather: "Demo forecast: warm with a chance of showers", holidays: "Check local public holidays before departure", seasonalContext: "Typical seasonal conditions", sourceTimestamp: new Date().toISOString(), forecastAvailable: false }, routes: itinerary.map((day) => ({ day: day.day, totalDistanceKm: day.activities.reduce((sum, activity) => sum + activity.distanceKmFromPrevious, 0), estimatedTravelMinutes: day.activities.reduce((sum, activity) => sum + activity.travelMinutesFromPrevious, 0), stops: day.activities.map((activity) => ({ title: activity.title, lat: 14.5995 + day.day / 100, lng: 120.9842 + day.day / 100 })) })), status: "ready", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const prototypeOptions = {
    MNL: { airlines: ["Philippine Airlines", "Cebu Pacific"], hotels: ["The Manila Hotel", "Bayview Park Hotel Manila"] },
    CEB: { airlines: ["Philippine Airlines", "Cebu Pacific"], hotels: ["Seda Central Bloc Cebu", "Radisson Blu Cebu"] },
    DGT: { airlines: ["Cebu Pacific", "Philippine Airlines"], hotels: ["Hotel Essencia", "Sierra Hotel Dumaguete"] },
    PPS: { airlines: ["Philippine Airlines", "AirSWIFT"], hotels: ["Costa Palawan Resort", "Hue Hotels and Resorts Puerto Princesa"] },
    USU: { airlines: ["Philippine Airlines", "Cebu Pacific"], hotels: ["The Funny Lion", "Coron Westown Resort"] },
    TAC: { airlines: ["Philippine Airlines", "Cebu Pacific"], hotels: ["Hotel XYZ", "Summit Hotel Tacloban"] },
    LAO: { airlines: ["Philippine Airlines", "Cebu Pacific"], hotels: ["Java Hotel", "Fort Ilocandia Resort Hotel"] },
    PAL: { airlines: ["Philippine Airlines", "AirSWIFT"], hotels: ["Costa Palawan Resort", "Hue Hotels and Resorts Puerto Princesa"] },
    BOH: { airlines: ["Philippine Airlines", "Cebu Pacific"], hotels: ["Henann Resort Alona Beach", "Bohol Beach Club"] },
    BOR: { airlines: ["Philippine Airlines", "Cebu Pacific"], hotels: ["Fairways and Bluewater Boracay", "Henann Regency Resort"] },
    BAN: { airlines: ["Philippine Airlines", "Cebu Pacific"], hotels: ["Banaue Hotel", "Baleh Boble Guesthouse"] },
  }[input.destination] || { airlines: ["Philippine Airlines"], hotels: [`${input.destination} Harbor Hotel`] };
  trip.offers = {
    flights: prototypeOptions.airlines.map((airline, index) => ({ id: id("prototype-flight"), route: `${input.origin} → ${input.destination}`, airline, fare: 8500 + index * 1800, currency, availability: "Check availability", baggage: "Check airline rules", mandatoryCharges: "See provider details", quotedAt: new Date().toISOString(), sample: true })),
    hotels: prototypeOptions.hotels.map((name, index) => ({ id: id("prototype-hotel"), name, location: `${input.destination}, Philippines`, guests: Number(input.travelers), nightlyRate: 3500 + index * 900, totalStay: hotel + index * 1800, currency, availability: "Check availability", taxesAndFees: "See provider details", quotedAt: new Date().toISOString(), sample: true })),
  };
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

module.exports = { users, trips, notifications, priceTrackers, id, publicUser, enrichTrip, applyItinerary };
