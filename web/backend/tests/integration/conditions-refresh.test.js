const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");

test("conditions refresh checks ownership and preserves the itinerary and travel offers", async (t) => {
  const auth = require("../../src/middleware/auth.middleware");
  const repository = require("../../src/services/trip-repository.service");
  const conditionsService = require("../../src/services/travelConditionsService");
  const { enrichTrip, trips } = require("../../src/store");
  const original = enrichTrip({ origin: "MNL", destination: "DGT", departure: "2026-11-30", returnDate: "2026-12-01", travelers: 1, currency: "PHP", budget: 10000 }, "owner");
  trips.set(original.id, original);
  const expected = { weather: { days: [] }, holidays: { items: [] }, generatedAt: "2026-11-20T00:00:00.000Z" };
  mock.method(auth, "requireAuth", (req, res, next) => { req.user = { id: req.headers["x-test-user"] || "owner" }; next(); });
  mock.method(repository, "getTrip", async (id, owner) => trips.get(id)?.ownerId === owner ? trips.get(id) : null);
  const save = mock.method(repository, "saveTrip", async (trip) => { trips.set(trip.id, trip); return trip; });
  const provider = mock.method(conditionsService, "getTravelConditions", async () => expected);
  const app = express();
  app.use(express.json());
  app.use("/trips", require("../../src/routes/trips.routes"));
  app.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
    res.status(500).json({ error: { message: "Refresh failed." } });
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => { mock.restoreAll(); trips.delete(original.id); return new Promise((resolve) => server.close(resolve)); });
  const base = `http://127.0.0.1:${server.address().port}/trips`;
  const forbidden = await fetch(`${base}/${original.id}/refresh-conditions`, { method: "POST", headers: { "x-test-user": "someone-else" } });
  assert.equal(forbidden.status, 404);
  const missing = await fetch(`${base}/missing/refresh-conditions`, { method: "POST" });
  assert.equal(missing.status, 404);
  assert.equal(provider.mock.callCount(), 0);

  const response = await fetch(`${base}/${original.id}/refresh-conditions`, { method: "POST" });
  assert.equal(response.status, 200);
  const { trip } = await response.json();
  assert.deepEqual(trip.conditions, expected);
  assert.equal(trip.id, original.id);
  assert.deepEqual(trip.itinerary, original.itinerary);
  assert.deepEqual(trip.offers, original.offers);
  assert.deepEqual(trip.budgetBreakdown, original.budgetBreakdown);
  assert.equal(save.mock.callCount(), 1);
  assert.equal(provider.mock.callCount(), 1);

  provider.mock.mockImplementation(async () => { throw new Error("Provider failed"); });
  const failed = await fetch(`${base}/${original.id}/refresh-conditions`, { method: "POST" });
  assert.equal(failed.status, 500);
  assert.equal(save.mock.callCount(), 1);
  assert.deepEqual(trips.get(original.id).conditions, expected);
});
