//USE THIS TO TEST PROVIDERS!!!!

const path = require("node:path");
const { loadEnvFile } = require("node:process");

// Load backend environment variables.
loadEnvFile(path.join(__dirname, "../.env"));

const {
  getPublicHolidays,
} = require("../src/services/providers/nagerDateProvider");

const {
  getWeatherForecast,
} = require("../src/services/providers/openWeatherProvider");

async function testProviders() {
  // Test 1: Philippine public holidays
  console.log("\nTesting Nager.Date API...");

  try {
    const holidays = await getPublicHolidays(2027, "PH");

    console.log("SUCCESS: Nager.Date connected!");
    console.log("Total holidays:", holidays.length);
    console.log("Sample holidays:", holidays.slice(0, 3));
  } catch (error) {
    console.error("FAILED: Nager.Date");
    console.error(error.message);
  }

  // Test 2: Manila weather forecast
  console.log("\nTesting OpenWeather API...");

  try {
    const latitude = 14.5995;
    const longitude = 120.9842;

    const forecast = await getWeatherForecast(
      latitude,
      longitude
    );

    console.log("SUCCESS: OpenWeather connected!");
    console.log("Forecast entries:", forecast.list.length);
    console.log("First forecast:", forecast.list[0]);
  } catch (error) {
    console.error("FAILED: OpenWeather");
    console.error(error.message);
  }
}

testProviders().catch(console.error);
