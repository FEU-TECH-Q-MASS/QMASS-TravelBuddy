const test = require("node:test");
const assert = require("node:assert/strict");
const { enrichTrip } = require("../../src/store");

test("group estimates scale per-person costs and account for shared rooms and transport", () => {
  const plan = (travelers, returnDate = "2026-12-04") => enrichTrip({
    origin: "MNL", destination: "CEB", departure: "2026-12-03", returnDate,
    travelers, budget: 10000.50, currency: "PHP", includeFlights: true,
  }, "traveler");
  const { budgetBreakdown: solo, routes } = plan(1);
  const { budgetBreakdown: group, estimateBasis, offers } = plan(4);
  assert.equal(group.flights, solo.flights * 4);
  assert.equal(group.meals, solo.meals * 4);
  assert.equal(group.activities, solo.activities * 4);
  assert.equal(group.accommodation, solo.accommodation * 2);
  assert.equal(group.accommodation, offers.hotels[0].totalStay);
  assert.equal(group.transportation, solo.transportation);
  assert.equal(plan(5).budgetBreakdown.transportation, group.transportation * 2);
  assert.equal(plan(4, "2026-12-03").budgetBreakdown.accommodation, 0);
  assert.equal(group.remaining, 10000.50 - group.estimatedTotal);
  assert.equal(estimateBasis.rooms, 2);
  assert.notDeepEqual(routes[0].stops, routes[1].stops);
  assert.equal(routes[0].totalDistanceKm, undefined);
});
