
const path = require("node:path");
const { loadEnvFile } = require("node:process");

loadEnvFile(path.join(__dirname, "../.env"));

const {
  getTravelConditions,
} = require("../src/services/travelConditionsService");

async function testTravelConditions() {
  // Create a sample trip within the forecast window.
  const today = new Date();

  const departure = new Date(today);
  departure.setUTCDate(today.getUTCDate() + 1);

  const returnDate = new Date(today);
  returnDate.setUTCDate(today.getUTCDate() + 3);

  const trip = {
    id: "test-trip-001",
    destination: "Manila, Philippines",
    countryCode: "PH",
    latitude: 14.5995,
    longitude: 120.9842,
    departure: departure.toISOString().slice(0, 10),
    returnDate: returnDate.toISOString().slice(0, 10),
    travelers: 2,
    currency: "PHP",
  };

  console.log("\nTesting Travel Conditions Service...");
  console.log("Destination:", trip.destination);
  console.log("Departure:", trip.departure);
  console.log("Return:", trip.returnDate);

  const conditions = await getTravelConditions(trip);

  console.log("\n=== WEATHER ===");
  console.log("Status:", conditions.weather.status);
  console.log("Provider:", conditions.weather.provider);
  console.log("Fetched at:", conditions.weather.fetchedAt);
  console.log(
    "Forecast entries:",
    conditions.weather.days.length
  );
  console.log(
    "First entry:",
    conditions.weather.days[0] || "None"
  );

  console.log("\n=== HOLIDAYS ===");
  console.log("Status:", conditions.holidays.status);
  console.log("Provider:", conditions.holidays.provider);
  console.log(
    "Holidays during trip:",
    conditions.holidays.items
  );

  console.log("\n=== WARNINGS ===");
  console.log(conditions.warnings);

  console.log("\n=== COMPLETE RESPONSE ===");
  console.log(JSON.stringify(conditions, null, 2));

  // Basic structural assertions
  const assert = require("node:assert/strict");

  assert.ok(conditions.generatedAt);
  assert.ok(Array.isArray(conditions.weather.days));
  assert.ok(Array.isArray(conditions.holidays.items));
  assert.ok(Array.isArray(conditions.warnings));

  console.log("\nPASS: Response structure is valid.");

  if (conditions.weather.status !== "available") {
    console.warn("Weather provider did not return trip forecasts.");
  }

  if (conditions.holidays.status !== "available") {
    console.warn("Holiday provider data is unavailable.");
  }
}

testTravelConditions().catch((error) => {
  console.error("\nTEST FAILED:", error);
  process.exitCode = 1;
});
