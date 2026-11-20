
const {
  getWeatherForecast,
} = require("./providers/openWeatherProvider");

const {
  getActivityWarnings,
} = require("./conditionWarningsService");

const {
  getPublicHolidays,
} = require("./providers/nagerDateProvider");

const { findDestination } = require("../../../shared/destinations.cjs");

function getDestinationCoordinates(trip) {
  if (trip.latitude != null && trip.longitude != null) {
    return [Number(trip.latitude), Number(trip.longitude)];
  }
  return findDestination(trip.destination)?.coordinates || null;
}

function isValidDate(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

async function getTravelConditions(trip) {
  const generatedAt = new Date().toISOString();

  const conditions = {
    weather: {
      status: "unavailable",
      dataType: "forecast",
      provider: "OpenWeather",
      fetchedAt: null,
      forecastThrough: null,
      days: [],
    },
    holidays: {
      status: "unavailable",
      provider: "Nager.Date",
      fetchedAt: null,
      items: [],
    },
    seasonalInsights: {
      status: "unavailable",
      items: [],
    },
    historicalPricing: {
      status: "unavailable",
      items: [],
    },
    warnings: [],
    generatedAt,
  };

  // WEATHER
  const coordinates = getDestinationCoordinates(trip);
  const latitude = coordinates?.[0];
  const longitude = coordinates?.[1];

  if (
    coordinates &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    try {
      const forecast = await getWeatherForecast(
        latitude,
        longitude
      );

      const entries = forecast.list.map((item) => ({
        date: new Date(item.dt * 1000)
          .toISOString()
          .slice(0, 10),
        timestamp: new Date(item.dt * 1000)
          .toISOString(),
        temperatureC: item.main.temp,
        humidity: item.main.humidity,
        condition:
          item.weather[0]?.description || "Unknown",
        rainProbability: item.pop ?? null,
      }));

      const fetchedAt = new Date().toISOString();

      conditions.weather = {
        status: "available",
        dataType: "forecast",
        provider: "OpenWeather",
        fetchedAt,
        forecastThrough:
          entries.at(-1)?.date || null,
        days: entries.filter(
          (entry) =>
            isValidDate(trip.departure) &&
            isValidDate(trip.returnDate) &&
            entry.date >= trip.departure &&
            entry.date <= trip.returnDate
        ),
      };

      if (conditions.weather.days.length === 0) {
        conditions.weather.status =
          "outside_forecast_window";
      }
    } catch {
      conditions.weather.error =
        "Weather information is temporarily unavailable.";
    }
  }

  // PUBLIC HOLIDAYS
  if (
    (trip.countryCode || "PH") &&
    isValidDate(trip.departure) &&
    isValidDate(trip.returnDate)
  ) {
    try {
      const startYear = Number(
        trip.departure.slice(0, 4)
      );
      const endYear = Number(
        trip.returnDate.slice(0, 4)
      );

      const years = Array.from(
        { length: endYear - startYear + 1 },
        (_, index) => startYear + index
      );

      if (years.length > 0 && years.length <= 3) {
        const results = await Promise.all(
          years.map((year) =>
            getPublicHolidays(
              year,
              (trip.countryCode || "PH").toUpperCase()
            )
          )
        );

        const holidays = results
          .flat()
          .filter(
            (holiday) =>
              holiday.date >= trip.departure &&
              holiday.date <= trip.returnDate
          );

        conditions.holidays = {
          status: "available",
          provider: "Nager.Date",
          fetchedAt: new Date().toISOString(),
          items: holidays,
        };
      }
    } catch {
      conditions.holidays.error =
        "Holiday information is temporarily unavailable.";
    }
  }

  // FORECAST COVERAGE WARNING
  if (
    conditions.weather.status ===
    "outside_forecast_window"
  ) {
    conditions.warnings.push({
      code: "FORECAST_UNAVAILABLE",
      severity: "info",
      message:
        "Weather forecasts are not available for the selected travel dates.",
      sourceType: "availability",
    });
  }


  // ACTIVITY-SPECIFIC WEATHER WARNINGS
  if (
    conditions.weather.status === "available" &&
    Array.isArray(trip.itinerary)
  ) {
    const activityWarnings = getActivityWarnings(
      trip.itinerary,
      conditions.weather
    );

    conditions.warnings.push(...activityWarnings);
  }


  return conditions;
}

module.exports = { getTravelConditions };
