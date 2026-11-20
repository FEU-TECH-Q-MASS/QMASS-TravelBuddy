const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");

test("editing a trip keeps its workspace, validates changes, and enforces ownership", async (t) => {
  const auth = require("../../src/middleware/auth.middleware");
  mock.method(auth, "requireAuth", (req, res, next) => { req.user = { id: req.headers["x-test-user"] || "owner" }; next(); });
  const repository = require("../../src/services/trip-repository.service");
  const travelData = require("../../src/services/travel-data.service");
  const itineraryService = require("../../src/services/itinerary.service");
  const { lastTripDate, todayInPhilippines } = require("../../../shared/tripDates.cjs");
  const { enrichTrip, trips } = require("../../src/store");
  const input = { origin: "MNL", destination: "DGT", departure: "2026-11-30", returnDate: "2026-12-01", travelers: 1, budget: 10000, currency: "PHP", includeFlights: false };
  const original = enrichTrip({ ...input, interests: ["Nature"] }, "owner");
  trips.set(original.id, original);
  mock.method(repository, "getTrip", async (id, ownerId) => trips.get(id)?.ownerId === ownerId ? trips.get(id) : null);
  mock.method(repository, "saveTrip", async (trip, expectedUpdatedAt) => {
    if (expectedUpdatedAt !== undefined && trips.get(trip.id)?.updatedAt !== expectedUpdatedAt) return null;
    trips.set(trip.id, trip);
    return trip;
  });
  const generate = mock.method(itineraryService, "generateItinerary", async () => { throw new Error("Provider unavailable"); });
  mock.method(travelData, "refreshTravelData", async (trip) => ({
    offers: {
      flights: [],
      hotels: [{ id: "refreshed-hotel", name: "Sample hotel", currency: trip.currency, nightlyRate: 4500 }],
    },
    conditions: trip.conditions,
    providers: { hotels: "sample" },
  }));
  const app = express();
  app.use(express.json());
  app.use("/trips", require("../../src/routes/trips.routes"));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => { mock.restoreAll(); trips.delete(original.id); return new Promise((resolve) => server.close(resolve)); });
  const url = `http://127.0.0.1:${server.address().port}/trips/${original.id}`;
  const create = (body) => fetch(`http://127.0.0.1:${server.address().port}/trips`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const patch = (body, user = "owner") => fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json", "x-test-user": user }, body: JSON.stringify(body) });

  const forbidden = await patch(input, "someone-else");
  assert.equal(forbidden.status, 404);
  const nationwide = await create({ ...input, destination: "0305415000" });
  assert.equal(nationwide.status, 201);
  const { trip: porac } = await nationwide.json();
  t.after(() => trips.delete(porac.id));
  assert.equal(porac.destination, "0305415000");
  assert.equal(porac.itinerary[0].activities[0].location, "Porac, Pampanga, Philippines");
  assert.equal((await create({ ...input, destination: "0000000000" })).status, 400);
  const venuePath = url.replace(original.id, porac.id) + "/venues/1";
  const venues = await fetch(venuePath);
  assert.equal(venues.status, 200);
  assert.equal(venues.headers.get("Cache-Control"), "private, no-store");
  assert.deepEqual(await venues.json(), { venues: {} });
  assert.equal((await fetch(venuePath, { headers: { "x-test-user": "someone-else" } })).status, 404);
  for (const invalid of [
    { returnDate: "2026-11-29" }, { departure: "invalid" }, { returnDate: "2026-12-20" },
    { travelers: 0 }, { budget: 0 }, { currency: "INVALID" }, { destination: " " }, { destination: "PAL" },
  ]) {
    const response = await patch({ ...input, ...invalid });
    assert.equal(response.status, 400);
    assert.equal(trips.get(original.id).destination, "DGT");
  }
  const budgetOnly = await patch({ ...input, budget: 5000.50 });
  assert.equal(budgetOnly.status, 200);
  const { trip: repriced, generateItinerary: generateForBudgetEdit } = await budgetOnly.json();
  assert.equal(generateForBudgetEdit, false);
  assert.equal(generate.mock.callCount(), 0);
  assert.equal(repriced.budget, 5000.50);
  assert.deepEqual(repriced.itinerary, original.itinerary);
  assert.deepEqual(repriced.routes, original.routes);
  assert.deepEqual(repriced.conditions, original.conditions);
  assert.deepEqual(repriced.offers, original.offers);
  assert.equal(repriced.budgetBreakdown.estimatedTotal, original.budgetBreakdown.estimatedTotal);
  assert.equal(repriced.budgetBreakdown.remaining, repriced.budget - repriced.budgetBreakdown.estimatedTotal);
  const refresh = await fetch(`${url}/refresh-data`, { method: "POST" });
  assert.equal(refresh.status, 200);
  const { trip: refreshed } = await refresh.json();
  assert.equal(refreshed.budgetBreakdown.accommodation, refreshed.offers.hotels[0].totalStay);
  assert.equal(refreshed.budgetBreakdown.estimatedTotal - repriced.budgetBreakdown.estimatedTotal, 1000);
  const editAfterRefresh = await patch({ ...input, budget: 6000 });
  assert.equal(editAfterRefresh.status, 200);
  assert.deepEqual((await editAfterRefresh.json()).trip.offers, refreshed.offers);
  const response = await patch({ ...input, destination: "BAN", returnDate: "2026-12-02", budget: 30000, travelers: 2, includeFlights: true, id: "injected", ownerId: "someone-else" });
  assert.equal(response.status, 200);
  const { trip, generateItinerary: generateForScheduleEdit } = await response.json();
  assert.equal(generateForScheduleEdit, true);
  assert.deepEqual(trip.itineraryUpdate, { reason: "schedule", status: "pending" });
  assert.equal(generate.mock.callCount(), 0);
  assert.equal(trip.id, original.id);
  assert.equal(trip.ownerId, "owner");
  assert.equal(trip.createdAt, original.createdAt);
  assert.equal(trip.destination, "BAN");
  assert.equal(trip.travelers, 2);
  assert.equal(trip.budget, 30000);
  assert.equal(trip.itinerary.length, 3);
  assert.equal(trip.routes.length, 3);
  assert.equal(trip.includeFlights, false);
  assert.equal(trip.budgetBreakdown.flights, 0);
  assert.deepEqual(trip.offers.flights, []);
  assert.deepEqual(trip.interests, ["Nature"]);
  const saved = await fetch(url, { headers: { "x-test-user": "owner" } });
  assert.equal((await saved.json()).trip.destination, "BAN");

  const generateFor = (savedTrip, reason) => fetch(`${url}/generate`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, updatedAt: savedTrip.updatedAt }),
  });
  const failedResponse = await generateFor(trip, "schedule");
  assert.equal(failedResponse.status, 200);
  const { trip: failed } = await failedResponse.json();
  assert.equal(failed.itineraryUpdate.status, "failed");
  assert.equal(failed.destination, trip.destination);
  assert.deepEqual(failed.itinerary, trip.itinerary);

  const generatedPlan = (current, cost) => ({
    provider: "google-gemini", model: "test", generatedAt: new Date().toISOString(),
    itinerary: current.itinerary.map((day) => ({
      ...day,
      activities: [{ ...day.activities[0], title: "AI activity", cost }],
    })),
  });
  generate.mock.mockImplementation(async (current) => generatedPlan(current, 500));
  const successResponse = await generateFor(failed, "schedule");
  assert.equal(successResponse.status, 200);
  const { trip: generated } = await successResponse.json();
  assert.equal(generated.itineraryUpdate, null);
  assert.equal(generated.generation.provider, "google-gemini");
  assert.equal(generated.itinerary[0].activities[0].title, "AI activity");

  const fixedCosts = generated.budgetBreakdown.estimatedTotal - generated.budgetBreakdown.activities;
  const updatedInput = { ...input, destination: trip.destination, returnDate: trip.returnDate, travelers: trip.travelers };
  const { trip: tooLow } = await (await patch({ ...updatedInput, budget: fixedCosts - 1 })).json();
  const beforeFixedCostsCheck = generate.mock.callCount();
  const { trip: fixedCostsResult } = await (await generateFor(tooLow, "budget")).json();
  assert.equal(fixedCostsResult.itineraryUpdate.status, "fixed-costs");
  assert.equal(generate.mock.callCount(), beforeFixedCostsCheck);

  const { trip: overBudget } = await (await patch({ ...updatedInput, budget: fixedCosts + 1000 })).json();
  const { trip: unfit } = await (await generateFor(overBudget, "budget")).json();
  assert.equal(unfit.itineraryUpdate.status, "unfit");
  assert.deepEqual(unfit.itinerary, generated.itinerary);

  generate.mock.mockImplementation(async (current) => generatedPlan(current, 100));
  const { trip: replanned } = await (await generateFor(unfit, "budget")).json();
  assert.equal(replanned.itineraryUpdate, null);
  assert.ok(replanned.budgetBreakdown.remaining >= 0);
  assert.equal(replanned.itinerary[0].activities[0].cost, 100);

  const newSchedule = await patch({ ...updatedInput, returnDate: "2026-12-03", budget: 30000 });
  const { trip: pending } = await newSchedule.json();
  let releaseGeneration;
  let generationStarted;
  const started = new Promise((resolve) => { generationStarted = resolve; });
  generate.mock.mockImplementation((current) => new Promise((resolve) => {
    releaseGeneration = () => resolve(generatedPlan(current, 100));
    generationStarted();
  }));
  const inProgress = generateFor(pending, "schedule");
  await started;
  const laterEdit = await patch({ ...updatedInput, returnDate: "2026-12-04", budget: 40000 });
  releaseGeneration();
  assert.equal(laterEdit.status, 200);
  assert.equal((await inProgress).status, 409);
  assert.equal(trips.get(trip.id).returnDate, "2026-12-04");
  assert.equal(trips.get(trip.id).budget, 40000);

  const departure = todayInPhilippines();
  const returnDate = lastTripDate(departure);
  const tooLong = new Date(Date.parse(`${returnDate}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
  for (const invalid of [{ departure: "2026-02-30" }, { departure: "2000-01-01" }, { returnDate: tooLong }]) {
    assert.equal((await create({ ...input, departure, returnDate, ...invalid })).status, 400);
  }
  const created = await create({ ...input, departure, returnDate });
  assert.equal(created.status, 201);
  const { trip: fullLength } = await created.json();
  assert.equal(fullLength.itinerary.length, 14);
  assert.equal(fullLength.itinerary.at(-1).date, returnDate);
  t.after(() => trips.delete(fullLength.id));
});
