const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");

test("editing a trip keeps its workspace, validates changes, and enforces ownership", async (t) => {
  const auth = require("../../src/middleware/auth.middleware");
  mock.method(auth, "requireAuth", (req, res, next) => { req.user = { id: req.headers["x-test-user"] || "owner" }; next(); });
  const repository = require("../../src/services/trip-repository.service");
  const { enrichTrip, trips } = require("../../src/store");
  const input = { origin: "MNL", destination: "DGT", departure: "2026-11-30", returnDate: "2026-12-01", travelers: 1, budget: 10000, currency: "PHP", includeFlights: false };
  const original = enrichTrip({ ...input, interests: ["Nature"] }, "owner");
  mock.method(repository, "getTrip", async (id, ownerId) => trips.get(id)?.ownerId === ownerId ? trips.get(id) : null);
  mock.method(repository, "saveTrip", async (trip) => { trips.set(trip.id, trip); return trip; });
  const app = express();
  app.use(express.json());
  app.use("/trips", require("../../src/routes/trips.routes"));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => { mock.restoreAll(); trips.delete(original.id); return new Promise((resolve) => server.close(resolve)); });
  const url = `http://127.0.0.1:${server.address().port}/trips/${original.id}`;
  const patch = (body, user = "owner") => fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json", "x-test-user": user }, body: JSON.stringify(body) });

  const forbidden = await patch(input, "someone-else");
  assert.equal(forbidden.status, 404);
  for (const invalid of [
    { returnDate: "2026-11-29" }, { departure: "invalid" }, { returnDate: "2026-12-20" },
    { travelers: 0 }, { budget: 1 }, { currency: "INVALID" }, { destination: " " }, { destination: "PAL" },
  ]) {
    const response = await patch({ ...input, ...invalid });
    assert.equal(response.status, 400);
    assert.equal(trips.get(original.id).destination, "DGT");
  }
  const response = await patch({ ...input, destination: "BAN", returnDate: "2026-12-02", budget: 30000, travelers: 2, includeFlights: true, id: "injected", ownerId: "someone-else" });
  assert.equal(response.status, 200);
  const { trip } = await response.json();
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
});
