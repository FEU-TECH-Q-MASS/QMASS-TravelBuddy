const crypto = require("node:crypto");
const { destinationLocation, findDestination } = require("../../shared/destinations.cjs");
const { getTripTransport } = require("../../shared/transport.cjs");

const airfareAllowances = { PHP: 12000, USD: 220, EUR: 200, JPY: 33000 };

const trips = new Map();
const notifications = new Map();
const priceTrackers = new Map();

function id(prefix) { return `${prefix}_${crypto.randomUUID()}`; }
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
  const destination = findDestination(input.destination);
  const localStops = destination?.highlights.length ? destination.highlights : [destinationLocation(input.destination)];
  const destinationName = destination?.name || input.destination;
  return Array.from({ length: Math.min(days, 14) }, (_, index) => ({
    day: index + 1,
    date: new Date(start.getTime() + index * 86400000).toISOString().slice(0, 10),
    activities: [
      { id: id("activity"), time: "09:00", title: `${plans[index % plans.length][0]} in ${destinationName}`, location: localStops[0], durationMinutes: 120, cost: 500 + index * 50, travelMinutesFromPrevious: 0, distanceKmFromPrevious: 0 },
      { id: id("activity"), time: "13:00", title: `${plans[index % plans.length][1]} in ${destinationName}`, location: localStops[1 % localStops.length], durationMinutes: 120, cost: 650 + index * 75, travelMinutesFromPrevious: 20 + index * 5, distanceKmFromPrevious: 2.4 + index * 0.6 },
      { id: id("activity"), time: "17:00", title: plans[index % plans.length][2], location: localStops[2 % localStops.length], durationMinutes: 120, cost: 300 + index * 40, travelMinutesFromPrevious: 15 + index * 5, distanceKmFromPrevious: 1.8 + index * 0.5 },
    ],
  }));
}

function makeRoutes(itinerary) {
  return itinerary.map((day) => ({
    day: day.day,
    totalDistanceKm: day.activities.reduce((sum, activity) => sum + activity.distanceKmFromPrevious, 0),
    estimatedTravelMinutes: day.activities.reduce((sum, activity) => sum + activity.travelMinutesFromPrevious, 0),
    stops: day.activities.map(({ title, location }) => ({ title, location })),
  }));
}

function enrichTrip(input, ownerId, tripId = crypto.randomUUID()) {
  const idValue = tripId;
  const itinerary = makeItinerary(input);
  const nights = Math.max(0, itinerary.length - 1);
  const currency = input.currency || "PHP";
  const transport = getTripTransport(input.origin, input.destination);
  const includeFlights = Boolean(input.includeFlights && transport?.route);
  const flight = includeFlights ? airfareAllowances[currency] || 0 : 0;
  const hotel = nights * 3500;
  const activities = itinerary.reduce((sum, day) => sum + day.activities.reduce((daySum, activity) => daySum + activity.cost, 0), 0);
  const estimatedTotal = flight + hotel + activities + itinerary.length * 1400;
  const now = new Date().toISOString();
  const trip = {
    id: idValue,
    ownerId,
    ...input,
    includeFlights,
    travelers: Number(input.travelers),
    budget: Number(input.budget),
    currency,
    itinerary,
    budgetBreakdown: {
      flights: flight, accommodation: hotel, activities, meals: itinerary.length * 900,
      transportation: itinerary.length * 500, estimatedTotal, remaining: Number(input.budget) - estimatedTotal, currency,
    },
    conditions: {
      weather: "Demo forecast: warm with a chance of showers", holidays: "Check local public holidays before departure",
      seasonalContext: "Typical seasonal conditions", sourceTimestamp: now, forecastAvailable: false,
    },
    routes: makeRoutes(itinerary),
    status: "ready",
    createdAt: now,
    updatedAt: now,
  };
  const prototypeOptions = {
    MNL: { hotels: ["The Manila Hotel", "Bayview Park Hotel Manila"] },
    CEB: { hotels: ["Seda Central Bloc Cebu", "Radisson Blu Cebu"] },
    DGT: { hotels: ["Hotel Essencia", "Sierra Hotel Dumaguete"] },
    PPS: { hotels: ["Costa Palawan Resort", "Hue Hotels and Resorts Puerto Princesa"] },
    USU: { hotels: ["The Funny Lion", "Coron Westown Resort"] },
    TAC: { hotels: ["Hotel XYZ", "Summit Hotel Tacloban"] },
    LAO: { hotels: ["Java Hotel", "Fort Ilocandia Resort Hotel"] },
    PAL: { hotels: ["Costa Palawan Resort", "Hue Hotels and Resorts Puerto Princesa"] },
    BOH: { hotels: ["Henann Resort Alona Beach", "Bohol Beach Club"] },
    BOR: { hotels: ["Fairways and Bluewater Boracay", "Henann Regency Resort"] },
    BAN: { hotels: ["Banaue Hotel", "Baleh Boble Guesthouse"] },
  }[input.destination] || { hotels: ["Sample accommodation"] };
  trip.offers = {
    flights: [],
    hotels: prototypeOptions.hotels.map((name, index) => ({ id: id("prototype-hotel"), name, location: destinationLocation(input.destination), guests: Number(input.travelers), nightlyRate: 3500 + index * 900, totalStay: hotel + index * 1800, currency, availability: "Check availability", taxesAndFees: "See provider details", quotedAt: new Date().toISOString(), sample: true })),
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
  trip.routes = makeRoutes(itinerary);
  trip.updatedAt = new Date().toISOString();
  return trip;
}

module.exports = { trips, notifications, priceTrackers, id, enrichTrip, applyItinerary };
