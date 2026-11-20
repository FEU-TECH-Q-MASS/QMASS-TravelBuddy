const assert = require("node:assert/strict");
const { test } = require("node:test");
const { generateItinerary } = require("../../src/services/itinerary.service");
const { getItineraryVenueDetails } = require("../../src/services/itinerary-venues.service");
const { findTripDestination, localDestinations } = require("../../../shared/destinations.cjs");

const date = "2026-11-24";
const trip = {
  destination: "0305415000", departure: date, returnDate: date, travelers: 1, currency: "PHP",
  budgetBreakdown: { activities: 500, remaining: 500 },
};

function configure(t, key, value) {
  const previous = process.env[key];
  process.env[key] = value;
  t.after(() => {
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  });
}

function geminiResponse(activities) {
  const text = JSON.stringify([{ date, activities }]);
  return Response.json({ candidates: [{ content: { parts: [{ text }] } }] });
}

function restaurant(id, type, province = "Pampanga", status = "OPERATIONAL", locality = "Porac") {
  return {
    id, types: [type], businessStatus: status, addressComponents: [
      { longText: locality, types: ["locality"] },
      { longText: province, types: ["administrative_area_level_2"] },
      { shortText: "PH", types: ["country"] },
    ],
  };
}

test("the destination catalog includes all PSGC cities and municipalities and disambiguates duplicate names", () => {
  assert.equal(localDestinations.length, 1642);
  assert.equal(new Set(localDestinations.map(({ code }) => code)).size, 1642);
  assert.equal(findTripDestination(trip.destination).name, "Porac, Pampanga");
  assert.ok(new Set(localDestinations.filter(({ locality }) => locality === "Santa Cruz").map(({ area }) => area)).size > 1);
  assert.equal(findTripDestination("DGT").airport, "DGT");
});

test("generation retries malformed output and saves only eligible venue IDs", async (t) => {
  configure(t, "GEMINI_API_KEY", "test-gemini");
  configure(t, "GOOGLE_PLACES_API_KEY", "test-places");
  let geminiCalls = 0;
  t.mock.method(global, "fetch", async (url, options) => {
    const request = typeof options.body === "string" ? JSON.parse(options.body) : null;
    if (url.startsWith("https://generativelanguage.googleapis.com/")) {
      geminiCalls += 1;
      assert.equal(request.generationConfig.responseJsonSchema.type, "array");
      if (geminiCalls === 1) return geminiResponse([{ time: "12:00", title: "Lunch at Historic محل", location: "Bayanihan Park", durationMinutes: 90, cost: 450 }]);
      return geminiResponse([
        { time: "11:00", kind: "museum", durationMinutes: 60, cost: 100 },
        { time: "12:00", kind: "lunch", title: "Lunch at Historic محل", durationMinutes: 90, cost: 450 },
        { time: "14:00", kind: "nature", durationMinutes: 300, cost: 300 },
      ]);
    }
    if (url.endsWith("places:searchText")) {
      assert.match(request.textQuery, /Porac, Pampanga, Philippines$/);
      if (request.includedType !== "restaurant") return Response.json({});
      return Response.json({ places: [
        restaurant("bayanihan", "park"), restaurant("wrong-province", "restaurant", "Tarlac"),
        restaurant("wrong-city", "restaurant", "Pampanga", "OPERATIONAL", "Angeles"),
        restaurant("closed", "restaurant", "Pampanga", "CLOSED_PERMANENTLY"), restaurant("real-restaurant", "restaurant"),
      ] });
    }
    assert.match(url, /\/places\/real-restaurant$/);
    return Response.json({ displayName: { text: "Actual local restaurant" }, formattedAddress: "Porac, Pampanga" });
  });
  const result = await generateItinerary(trip);
  const [museum, lunch, nature] = result.itinerary[0].activities;
  assert.equal(geminiCalls, 2);
  assert.equal(result.venueLookup, true);
  assert.equal(museum.placeId, undefined);
  assert.equal(lunch.title, "Lunch break");
  assert.equal(lunch.placeId, "real-restaurant");
  assert.equal(lunch.location, undefined);
  assert.equal(lunch.cost, 0);
  assert.equal(nature.title, "Miyamit Falls");
  assert.match(nature.venueNote, /permit/);
  assert.doesNotMatch(JSON.stringify(result), /Historic|Bayanihan|Actual local restaurant/);
  assert.deepEqual(await getItineraryVenueDetails([lunch]), {
    "real-restaurant": { name: "Actual local restaurant", address: "Porac, Pampanga", attributions: [] },
  });
});

test("a Places outage fails generation before replacing an existing itinerary", async (t) => {
  configure(t, "GEMINI_API_KEY", "test-gemini");
  configure(t, "GOOGLE_PLACES_API_KEY", "test-places");
  t.mock.method(global, "fetch", async (url) => url.includes("generateContent")
    ? geminiResponse([{ time: "12:00", kind: "lunch", durationMinutes: 90, cost: 0 }])
    : new Response(null, { status: 503 }));
  await assert.rejects(generateItinerary(trip), /Venue lookup is unavailable/);
});
