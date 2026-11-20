
const { env } = require("../config/env");

class DuffelApiError extends Error {
  constructor(message, status, details = []) {
    super(message);
    this.name = "DuffelApiError";
    this.status = status;
    this.details = details;
  }
}

async function duffelRequest(endpoint, options = {}) {
  const token = env.DUFFEL_ACCESS_TOKEN;

  if (!token) {
    throw new DuffelApiError(
      "Duffel Sandbox API token is not configured.",
      503
    );
  }

  if (!token.startsWith("duffel_test_")) {
    throw new DuffelApiError(
      "Only Duffel Sandbox tokens are allowed.",
      403
    );
  }

  const {
    method = "GET",
    body,
    query,
  } = options;

  const url = new URL(endpoint, env.DUFFEL_BASE_URL);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  let response;

  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Duffel-Version": env.DUFFEL_API_VERSION,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
      signal: AbortSignal.timeout(30000),
    });
  } catch (error) {
    throw new DuffelApiError(
      error.name === "TimeoutError"
        ? "Duffel API request timed out."
        : "Unable to connect to Duffel.",
      503
    );
  }

  let result;

  try {
    result = await response.json();
  } catch {
    throw new DuffelApiError(
      "Duffel returned an invalid JSON response.",
      502
    );
  }

  if (!response.ok) {
    const details = result.errors || [];

    throw new DuffelApiError(
      details[0]?.message || "Duffel API request failed.",
      response.status,
      details
    );
  }

  return result;
}

async function createOfferRequest({
  origin,
  destination,
  departureDate,
  returnDate,
  passengers = 1,
  cabinClass = "economy",
}) {
  const slices = [
    {
      origin,
      destination,
      departure_date: departureDate,
    },
  ];

  if (returnDate) {
    slices.push({
      origin: destination,
      destination: origin,
      departure_date: returnDate,
    });
  }

  return duffelRequest("/air/offer_requests", {
    method: "POST",
    body: {
      data: {
        slices,
        passengers: Array.from(
          { length: passengers },
          () => ({ type: "adult" })
        ),
        cabin_class: cabinClass,
      },
    },
  });
}

async function getOffer(offerId) {
  return duffelRequest(
    `/air/offers/${encodeURIComponent(offerId)}`
  );
}

module.exports = {
  DuffelApiError,
  duffelRequest,
  createOfferRequest,
  getOffer,
};
