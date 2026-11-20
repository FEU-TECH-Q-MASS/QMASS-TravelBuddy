const crypto = require("node:crypto");
const { destinationLocation, findDestination } = require("../../shared/destinations.cjs");
const { getTripTransport } = require("../../shared/transport.cjs");
const { dayMs, maxTripDays } = require("../../shared/tripDates.cjs");
const { getAllowances, updateTripEstimate } = require("./services/trip-budget.service");
const { getActivityWarnings } = require("./services/conditionWarningsService");

const trips = new Map();
const notifications = new Map();
const priceTrackers = new Map();

function id(prefix) { return `${prefix}_${crypto.randomUUID()}`; }
function makeItinerary(input) {
  const start = new Date(`${input.departure}T00:00:00Z`);
  const end = new Date(`${input.returnDate}T00:00:00Z`);
  const days = Math.min(maxTripDays, Math.max(1, (end - start) / dayMs + 1));
  const destination = findDestination(input.destination);
  const localStops = destination?.highlights.length ? destination.highlights : [destinationLocation(input.destination)];
  const stopsPerDay = Math.ceil(localStops.length / days);
  const { activity: cost } = getAllowances(input.currency);
  return Array.from({ length: days }, (_, index) => {
    const offset = (index * stopsPerDay) % localStops.length;
    const stops = localStops.slice(offset, offset + stopsPerDay);
    return {
      day: index + 1,
      date: new Date(start.getTime() + index * dayMs).toISOString().slice(0, 10),
      activities: stops.map((location, stopIndex) => ({
        id: id("activity"),
        time: ["09:00", "13:00", "17:00"][stopIndex],
        title: `Visit ${location}`,
        location,
        durationMinutes: 120,
        cost,
      })),
    };
  });
}

function makeRoutes(itinerary) {
  return itinerary.map((day) => ({
    day: day.day,
    stops: day.activities.map(({ title, location }) => ({ title, location })),
  }));
}

function enrichTrip(input, ownerId, tripId = crypto.randomUUID()) {
  const idValue = tripId;
  const itinerary = makeItinerary(input);
  const currency = input.currency || "PHP";
  const transport = getTripTransport(input.origin, input.destination);
  const includeFlights = Boolean(input.includeFlights && transport?.route);
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
    conditions: {
      weather: { status: "not_checked", provider: "OpenWeather" },
      holidays: { status: "not_checked", provider: "Nager.Date" },
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
  const { room } = getAllowances(currency);
  trip.offers = {
    flights: [],
    hotels: prototypeOptions.hotels.map((name, index) => ({
      id: id("prototype-hotel"), name, location: destinationLocation(input.destination),
      nightlyRate: index ? Math.round(room * 1.25) : room, currency,
      quotedAt: now, sample: true, source: "TravelBuddy sample",
    })),
  };
  updateTripEstimate(trip);
  return trip;
}

function applyItinerary(trip, itinerary, generation) {
  trip.itinerary = itinerary;
  trip.generation = generation;
  if (trip.conditions?.weather?.days) {
    trip.conditions = {
      ...trip.conditions,
      warnings: [
        ...(trip.conditions.warnings || []).filter((warning) => !warning.activityId),
        ...getActivityWarnings(itinerary, trip.conditions.weather),
      ],
    };
  }
  updateTripEstimate(trip);
  trip.routes = makeRoutes(itinerary);
  return trip;
}

module.exports = { trips, notifications, priceTrackers, id, enrichTrip, applyItinerary };
