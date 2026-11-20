import { test } from "node:test";
import assert from "node:assert/strict";
import { createTripSummary } from "../src/lib/tripPlanning.js";
import { authHref, newTripHref, tripAuthDestination, tripDestinationCode } from "../src/lib/tripPlannerNavigation.js";

test("budget respects the currency's minor units", () => {
  assert.equal(createTripSummary({ ...input, budget: "0.001" }, "2027-01-01").summary, null);
  assert.equal(createTripSummary({ ...input, budget: "100.50", currency: "JPY" }, "2027-01-01").summary, null);
  assert.equal(createTripSummary({ ...input, budget: "10000" }, "2027-01-01").summary.budget, 10000);
});
const input = {
  destination: " Kyoto ",
  departure: "2027-03-13",
  returnDate: "2027-03-15",
  travelers: "2",
  budget: "50000",
  currency: "PHP",
  includeFlights: true,
  interests: ["Culture", "unknown"],
};

test("summary counts calendar days and nights across a DST transition", () => {
  const { errors, summary } = createTripSummary(input, "2027-01-01");
  assert.deepEqual(errors, {});
  assert.equal(summary.days, 3);
  assert.equal(summary.nights, 2);
  assert.equal(summary.destination, "Kyoto");
  assert.equal(summary.budget, 50000);
  assert.equal(summary.includeFlights, true);
  assert.deepEqual(summary.interests, ["Culture"]);
});
test("a same-day trip has one day and zero nights", () => {
  const { summary } = createTripSummary(
    { ...input, returnDate: input.departure },
    "2027-01-01",
  );
  assert.equal(summary.days, 1);
  assert.equal(summary.nights, 0);
});
test("invalid calendar dates, past departures, and reversed ranges are rejected", () => {
  for (const change of [
    { departure: "2027-02-30" },
    { departure: "2026-12-31" },
    { returnDate: "2027-03-12" },
    { returnDate: "not-a-date" },
  ]) {
    assert.equal(
      createTripSummary({ ...input, ...change }, "2027-01-01").summary,
      null,
    );
  }
});
test("invalid budget, currency, traveler count, and blank destinations are rejected", () => {
  for (const change of [
    { budget: "0" },
    { budget: "-1" },
    { budget: "Infinity" },
    { currency: "unknown" },
    { travelers: "1.5" },
    { travelers: "0" },
    { destination: "  " },
  ]) {
    assert.equal(
      createTripSummary({ ...input, ...change }, "2027-01-01").summary,
      null,
    );
  }
});

test("a new trip only preselects a recognized destination", () => {
  assert.equal(tripDestinationCode(""), "");
  assert.equal(tripDestinationCode("Unknown"), "");
  assert.equal(tripDestinationCode("Cebu"), "CEB");
  assert.equal(tripDestinationCode("bOh"), "BOH");
  assert.equal(newTripHref(), "/trips/new");
  assert.equal(newTripHref({ destination: "Bohol" }), "/trips/new?destination=BOH");
});

test("auth can resume the new trip page and uses the dashboard for other targets", () => {
  const trip = newTripHref({ destination: "CEB", draft: true });
  const loginUrl = new URL(authHref("/login", trip), "https://travelbuddy.example");
  assert.equal(tripAuthDestination(loginUrl.searchParams.get("next")), trip);
  for (const invalid of [null, "//example.com/trips/new", "https://example.com/trips/new", "/trips/other", "/admin/users"]) {
    assert.equal(tripAuthDestination(invalid), "/dashboard");
  }
  assert.equal(authHref("/login", "/dashboard"), "/login");
  assert.equal(tripAuthDestination("/trips/new?destination=unknown&draft=2"), "/trips/new");
});
