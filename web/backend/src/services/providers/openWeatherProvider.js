
const { z } = require("zod");

const forecastSchema = z.object({
  list: z.array(
    z.object({
      dt: z.number(),
      main: z.object({
        temp: z.number(),
        humidity: z.number(),
      }),
      weather: z.array(
        z.object({
          description: z.string(),
        })
      ),
      pop: z.number().optional(),
    })
  ),
});

async function getWeatherForecast(lat, lon) {
  const latitude = z.number()
    .min(-90).max(90).parse(lat);

  const longitude = z.number()
    .min(-180).max(180).parse(lon);

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is missing");
  }

  const url = new URL(
    "https://api.openweathermap.org/data/2.5/forecast"
  );

  url.searchParams.set("lat", latitude);
  url.searchParams.set("lon", longitude);
  url.searchParams.set("appid", apiKey);
  url.searchParams.set("units", "metric");

  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(
      `OpenWeather API error: ${response.status}`
    );
  }

  const data = await response.json();

  return forecastSchema.parse(data);
}

module.exports = { getWeatherForecast };
