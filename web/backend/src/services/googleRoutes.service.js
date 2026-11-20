const { z } = require("zod");

const locationSchema = z.string().trim().min(1).max(200);
const routeInputSchema = z.object({
  origin: locationSchema,
  destination: locationSchema,
  waypoints: z.array(locationSchema).max(25).default([]),
});

function parseDuration(value) {
  const match = /^([0-9]+(?:\.[0-9]+)?)s$/.exec(String(value || ""));
  return match ? Number(match[1]) : null;
}

async function computeRoute(input) {
  const request = routeInputSchema.parse(input);
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!apiKey) {
    const error = new Error("Google Maps route service is not configured.");
    error.statusCode = 503;
    error.code = "MAPS_NOT_CONFIGURED";
    throw error;
  }

  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs",
    },
    body: JSON.stringify({
      origin: { address: request.origin },
      destination: { address: request.destination },
      intermediates: request.waypoints.map((address) => ({ address })),
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      computeAlternativeRoutes: false,
      languageCode: "en",
      units: "METRIC",
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    const error = new Error("Google Maps could not calculate this route.");
    error.statusCode = response.status === 429 ? 429 : 502;
    error.code = response.status === 429 ? "MAPS_RATE_LIMITED" : "MAPS_PROVIDER_ERROR";
    throw error;
  }

  const payload = await response.json();
  const route = payload.routes?.[0];
  if (!route) {
    const error = new Error("No route was found between those locations.");
    error.statusCode = 404;
    error.code = "ROUTE_NOT_FOUND";
    throw error;
  }

  return {
    distanceMeters: Number.isFinite(route.distanceMeters) ? route.distanceMeters : null,
    durationSeconds: parseDuration(route.duration),
    encodedPolyline: route.polyline?.encodedPolyline || null,
    legs: Array.isArray(route.legs) ? route.legs : [],
    provider: "Google Routes API",
    fetchedAt: new Date().toISOString(),
  };
}

module.exports = { computeRoute, routeInputSchema };
