const { destinationLocation, findTripDestination } = require("../../../shared/destinations.cjs");
const { configuredKey, searchPlaces, getPlaceDetails } = require("./providers/googlePlacesProvider");

const venueKinds = {
  breakfast: { title: "Breakfast break", type: "restaurant", query: "breakfast restaurants" },
  lunch: { title: "Lunch break", type: "restaurant", query: "lunch restaurants" },
  dinner: { title: "Dinner break", type: "restaurant", query: "dinner restaurants" },
  museum: { title: "Museum visit", type: "museum", query: "museums", isOutdoor: false },
  park: { title: "Park visit", type: "park", query: "parks", isOutdoor: true },
  market: { title: "Market visit", type: "market", query: "public markets" },
  landmark: { title: "Landmark visit", type: "historical_landmark", query: "historical landmarks" },
  beach: { title: "Beach visit", type: "beach", query: "beaches", isOutdoor: true },
  nature: { title: "Nature outing", type: "national_park", query: "national parks", isOutdoor: true },
  free_time: { title: "Free time" },
};

// Municipal tourism records fill specific coverage gaps. These records come from the LGU.
const tourismVenues = {
  "0305415000": {
    nature: {
      title: "Miyamit Falls",
      location: "Barangay Sapang Uwak, Porac, Pampanga, Philippines",
      venueSource: "https://www.poracpampanga.gov.ph/category/atrractions/",
      venueNote: "This is a trek. Confirm trail access and obtain a permit from Porac Tourism before visiting.",
      minimumMinutes: 240,
    },
  },
};

function normalizeArea(value) {
  return String(value || "").normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/\b(city|municipality|province) of\b/g, "").replace(/\b(city|province)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

function inSearchArea(place, destination) {
  const components = place.addressComponents || [];
  if (!components.some(({ types, shortText }) => types.includes("country") && shortText === "PH")) return false;
  if (destination?.coordinates) {
    if (!Number.isFinite(place.location?.latitude) || !Number.isFinite(place.location?.longitude)) return false;
    const [latitude, longitude] = destination.coordinates;
    return Math.abs(place.location.latitude - latitude) <= 0.23 && Math.abs(place.location.longitude - longitude) <= 0.23;
  }
  if (!destination?.locality) return false;
  const localityTypes = ["locality", "administrative_area_level_2", "administrative_area_level_3", "postal_town"];
  const localityMatches = components.some(({ types, longText }) =>
    types.some((type) => localityTypes.includes(type)) && normalizeArea(longText) === normalizeArea(destination.locality));
  if (!localityMatches) return false;

  const areas = destination.area === "Metro Manila" ? ["metro manila", "national capital region", "ncr"]
    : destination.area === "BARMM Special Geographic Area" ? ["bangsamoro autonomous region in muslim mindanao", "barmm", "special geographic area"]
    : [normalizeArea(destination.area)];
  return components.some(({ types, longText, shortText }) =>
    types.some((type) => type.startsWith("administrative_area_level_"))
    && [longText, shortText].some((name) => areas.includes(normalizeArea(name))));
}

async function findVenues(kind, trip, signal) {
  const destination = findTripDestination(trip.destination);
  const { type, query } = venueKinds[kind];
  const request = { textQuery: `${query} in ${destinationLocation(trip.destination)}`, includedType: type, strictTypeFiltering: true };
  if (destination?.coordinates) {
    const [latitude, longitude] = destination.coordinates;
    request.locationRestriction = { rectangle: {
      low: { latitude: latitude - 0.23, longitude: longitude - 0.23 },
      high: { latitude: latitude + 0.23, longitude: longitude + 0.23 },
    } };
  }
  const places = await searchPlaces(request, signal);
  return [...new Set(places.filter((place) =>
    place.id && !place.businessStatus?.startsWith("CLOSED") && place.types?.includes(type) && inSearchArea(place, destination),
  ).map(({ id }) => id))];
}

async function resolveItineraryVenues(itinerary, trip) {
  const kinds = [...new Set(itinerary.flatMap(({ activities }) => activities.map(({ venueKind }) => venueKind)))]
    .filter((kind) => venueKinds[kind].type);
  const signal = AbortSignal.timeout(7500);
  const lookups = configuredKey()
    ? await Promise.allSettled(kinds.map((kind) => findVenues(kind, trip, signal)))
    : [];
  const local = tourismVenues[trip.destination] || {};
  const byKind = new Map(kinds.map((kind, index) => [kind, lookups[index]?.value || []]));
  const used = new Set();

  return itinerary.map((day) => {
    const usedToday = new Set();
    return { ...day, activities: day.activities.map((activity) => {
      const { venueKind } = activity;
      const candidates = byKind.get(venueKind) || [];
      const placeId = candidates.find((id) => !used.has(id)) || candidates.find((id) => !usedToday.has(id));
      if (placeId) {
        used.add(placeId);
        usedToday.add(placeId);
        return { ...activity, placeId };
      }
      const localVenue = local[venueKind];
      if (localVenue && activity.durationMinutes >= localVenue.minimumMinutes && !used.has(localVenue.venueSource)) {
        const { title, location, venueSource, venueNote } = localVenue;
        used.add(venueSource);
        return { ...activity, title, location, venueSource, venueNote };
      }
      return activity;
    }) };
  });
}

async function getItineraryVenueDetails(activities) {
  if (!configuredKey()) return {};
  const ids = [...new Set(activities.map(({ placeId }) => placeId).filter(Boolean))];
  const signal = AbortSignal.timeout(6000);
  const places = await Promise.allSettled(ids.map(async (id) => [id, await getPlaceDetails(id, signal)]));
  return Object.fromEntries(places.flatMap((result) => result.status === "fulfilled" && result.value[1] ? [result.value] : []));
}

module.exports = { venueKinds, resolveItineraryVenues, getItineraryVenueDetails };
