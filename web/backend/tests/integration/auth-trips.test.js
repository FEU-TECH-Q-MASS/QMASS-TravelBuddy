const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const app = require("../../src/app");

async function runningServer(t) { const server = app.listen(0, "127.0.0.1"); await once(server, "listening"); t.after(() => new Promise((resolve) => server.close(resolve))); return `http://127.0.0.1:${server.address().port}`; }
test("registration, password reset, login, and trip ownership flow works", async (t) => {
  const base = await runningServer(t); const email = `traveler-${Date.now()}@example.test`;
  const registered = await fetch(`${base}/api/v1/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Test Traveler", email, password: "Start123!" }) });
  assert.equal(registered.status, 201); const account = await registered.json(); assert.ok(account.token); assert.equal(account.user.passwordHash, undefined);
  const resetRequested = await fetch(`${base}/api/v1/auth/forgot-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); const reset = await resetRequested.json(); assert.ok(reset.resetToken);
  const resetResponse = await fetch(`${base}/api/v1/auth/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: reset.resetToken, password: "Updated123!" }) }); assert.equal(resetResponse.status, 200);
  const loggedIn = await fetch(`${base}/api/v1/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "Updated123!" }) }); const session = await loggedIn.json(); assert.equal(loggedIn.status, 200);
  const created = await fetch(`${base}/api/v1/trips`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ origin: "MNL", destination: "CEB", departure: "2030-01-01", returnDate: "2030-01-03", travelers: 2, budget: 50000, currency: "PHP", interests: ["Food"], includeFlights: true }) }); const trip = (await created.json()).trip; assert.equal(created.status, 201); assert.equal(trip.ownerId, session.user.id);
  const generated = await fetch(`${base}/api/v1/trips/${trip.id}/generate`, { method: "POST", headers: { Authorization: `Bearer ${session.token}` } }); assert.equal(generated.status, 200); assert.ok((await generated.json()).trip.itinerary.length > 0);
  const deleted = await fetch(`${base}/api/v1/trips/${trip.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.token}` } }); assert.equal(deleted.status, 204);
});
