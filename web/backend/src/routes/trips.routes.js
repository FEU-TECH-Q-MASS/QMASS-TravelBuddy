const router = require("express").Router();
const { requireAuth } = require("../middleware/auth.middleware");
const { enrichTrip, applyItinerary } = require("../store");
const { saveTrip, listTrips, getTrip, deleteTrip } = require("../services/trip-repository.service");
const { generateItinerary } = require("../services/itinerary.service");
const { getItineraryVenueDetails } = require("../services/itinerary-venues.service");
const { refreshTravelData } = require("../services/travel-data.service");
const { getTravelConditions } = require("../services/travelConditionsService");
const { z } = require("zod");
const { findDestination, findTripDestination } = require("../../../shared/destinations.cjs");
const { todayInPhilippines, validateTripDates } = require("../../../shared/tripDates.cjs");
const { getTripTransport } = require("../../../shared/transport.cjs");
const { currencies, tripCurrency, minimumBudgets, maxTravelers, validateTravelers, validateBudget } = require("../../../shared/tripNumbers.cjs");
const { updateTripEstimate } = require("../services/trip-budget.service");

//seraching for tripFlights
const {
  searchTripFlights,
  getFlightSeatMaps,
  verifyFlightOffer,
  FlightSearchError,
} = require("../services/flight-offers.service");

const {
  DuffelApiError,
} = require("../services/duffel.service");

const itineraryRequests = new Set();
const generationInput = z.object({
  reason: z.enum(["schedule", "budget"]).default("schedule"),
  updatedAt: z.iso.datetime().optional(),
});

function tripChanged(res) {
  return res.status(409).json({ error: { code: "TRIP_CHANGED", message: "This trip changed while you were working. Open the workspace again to see the latest trip." } });
}

function saveTripUpdate(updated, previous) {
  const previousTime = Date.parse(previous.updatedAt) || 0;
  updated.updatedAt = new Date(Math.max(Date.now(), previousTime + 1)).toISOString();
  return saveTrip(updated, previous.updatedAt);
}

function tripDateError(input, previous) {
  const earliestDeparture = input.departure === previous?.departure ? undefined : todayInPhilippines();
  const { errors } = validateTripDates(input.departure, input.returnDate, earliestDeparture);
  return errors.departure || errors.returnDate;
}

function resolveTripLocations(input, previous) {
  const origin = findDestination(input.origin);
  const destination = findTripDestination(input.destination);
  const startingPoint = origin?.airport || (origin?.code === "BAN" ? "BAN" : null);
  if (!startingPoint && input.origin !== previous?.origin) return { error: "Choose a supported starting point." };
  if (destination?.code === "PAL") return { error: "Choose a base in Palawan." };
  if (!destination && input.destination !== previous?.destination) return { error: "Choose a supported destination." };
  return { origin: startingPoint || input.origin, destination: destination?.code || input.destination };
}

const tripEditSchema = z.object({
  origin: z.string().trim().min(1).max(120),
  destination: z.string().trim().min(1).max(120),
  departure: z.iso.date(),
  returnDate: z.iso.date(),
  travelers: z.coerce.number().int().min(1).max(maxTravelers),
  currency: z.enum(currencies),
  budget: z.union([z.number(), z.string()]),
  includeFlights: z.boolean(),
}).transform((input, context) => {
  const budget = input.currency === tripCurrency ? validateBudget(input.budget) : { value: Number(input.budget) };
  if (budget.error || !Number.isFinite(budget.value) || budget.value < minimumBudgets[input.currency]) {
    context.addIssue({ code: "custom", path: ["budget"], message: budget.error || "Enter a valid budget for this currency." });
    return z.NEVER;
  }
  return { ...input, budget: budget.value };
});

router.get("/", (req, res, next) => {
  if (!req.headers.authorization) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Endpoint not found." } });
  requireAuth(req, res, next);
}, async (req, res, next) => {
  try { res.json({ trips: await listTrips(req.user.id) }); } catch (error) { next(error); }
});
router.use(requireAuth);


router.get("/:id/flight-offers", async (req, res, next) => {
  try {
    const trip = await getTrip(
      req.params.id,
      req.user.id
    );

    if (!trip) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Trip not found.",
        },
      });
    }

    const result = await searchTripFlights(trip);

    return res.json(result);
  } catch (error) {
    if (error instanceof FlightSearchError) {
      return res.status(error.status).json({
        error: {
          code: "FLIGHT_SEARCH_INVALID",
          message: error.message,
        },
      });
    }

    if (error instanceof DuffelApiError) {
      console.error("Duffel flight search failed", {
        status: error.status,
        details: error.details,
      });

      return res.status(502).json({
        error: {
          code: "FLIGHT_PROVIDER_ERROR",
          message:
            "Flight search is temporarily unavailable.",
        },
      });
    }

    next(error);
  }
});


router.get(
  "/:id/flight-offers/:offerId/seat-maps",
  async (req, res, next) => {
    try {
      const trip = await getTrip(
        req.params.id,
        req.user.id
      );

      if (!trip) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Trip not found.",
          },
        });
      }

      if (!trip.includeFlights) {
        return res.status(400).json({
          error: {
            code: "FLIGHTS_DISABLED",
            message: "Flights are not enabled for this trip.",
          },
        });
      }

      const result = await getFlightSeatMaps(
        req.params.offerId
      );

      return res.json(result);
    } catch (error) {
      if (error instanceof FlightSearchError) {
        return res.status(error.status).json({
          error: {
            code: "FLIGHT_SEAT_MAP_ERROR",
            message: error.message,
          },
        });
      }

      if (error instanceof DuffelApiError) {
        console.error("Duffel seat map error", {
          status: error.status,
          details: error.details,
        });

        return res.status(502).json({
          error: {
            code: "FLIGHT_PROVIDER_ERROR",
            message: "Seat maps are unavailable for this offer.",
          },
        });
      }

      next(error);
    }
  }
);


router.post(
  "/:id/flight-offers/:offerId/verify",
  async (req, res, next) => {
    try {
      // Verify trip ownership
      const trip = await getTrip(
        req.params.id,
        req.user.id
      );

      if (!trip) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Trip not found.",
          },
        });
      }

      if (!trip.includeFlights) {
        return res.status(400).json({
          error: {
            code: "FLIGHTS_DISABLED",
            message: "Flights are not enabled for this trip.",
          },
        });
      }

      // Retrieve and verify the Duffel offer
      const result = await verifyFlightOffer(
        req.params.offerId
      );

      return res.json(result);

    } catch (error) {
      if (error instanceof FlightSearchError) {
        return res.status(error.status).json({
          error: {
            code: "FLIGHT_VERIFICATION_ERROR",
            message: error.message,
          },
        });
      }

      if (error instanceof DuffelApiError) {
        console.error(
          "Duffel offer verification failed",
          {
            status: error.status,
            details: error.details,
          }
        );

        // The offer may have expired or disappeared.
        // Do not expose provider internals to clients.
        if ([404, 410].includes(error.status)) {
          return res.status(410).json({
            error: {
              code: "FLIGHT_OFFER_UNAVAILABLE",
              message:
                "This flight offer is no longer available. Search again.",
            },
          });
        }

        return res.status(502).json({
          error: {
            code: "FLIGHT_PROVIDER_ERROR",
            message:
              "Unable to verify this flight offer.",
          },
        });
      }

      next(error);
    }
  }
);


router.post("/", async (req, res, next) => {
  try {
    const input = req.body || {};
    if (!input.origin || !input.destination || !input.departure || !input.returnDate) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Origin, destination, and dates are required." } });
    const travelers = validateTravelers(input.travelers);
    const budget = validateBudget(input.budget, input.currency);
    const validationError = tripDateError(input) || travelers.error || budget.error;
    if (validationError) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: validationError } });
    const locations = resolveTripLocations(input);
    if (locations.error) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: locations.error } });
    const preview = enrichTrip({ ...input, ...locations, travelers: travelers.value, budget: budget.value, currency: tripCurrency }, req.user.id);
    if (process.env.GEMINI_API_KEY) preview.itineraryUpdate = { reason: "schedule", status: "pending" };
    const trip = await saveTrip(preview);
    res.status(201).json({ trip });
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const trip = await getTrip(req.params.id, req.user.id);
    if (!trip) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip not found." } });
    res.json({ trip: trip.estimateBasis ? trip : updateTripEstimate({ ...trip }) });
  } catch (error) { next(error); }
});

router.get("/:id/venues/:day", async (req, res, next) => {
  try {
    const trip = await getTrip(req.params.id, req.user.id);
    const day = trip?.itinerary.find((item) => String(item.day) === req.params.day);
    if (!day) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip day not found." } });
    res.set("Cache-Control", "private, no-store");
    res.json({ venues: await getItineraryVenueDetails(day.activities) });
  } catch (error) { next(error); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const old = await getTrip(req.params.id, req.user.id);
    if (!old) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip not found." } });
    const currency = old.currency || tripCurrency;
    if (req.body?.currency !== undefined && req.body.currency !== currency) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Keep the saved trip’s original budget currency." } });
    }
    const parsed = tripEditSchema.safeParse({ ...req.body, currency });
    if (!parsed.success) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } });
    const dateError = tripDateError(parsed.data, old);
    if (dateError) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: dateError } });
    const locations = resolveTripLocations(parsed.data, old);
    if (locations.error) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: locations.error } });
    const changes = { ...parsed.data, ...locations };
    const rebuild = changes.destination !== old.destination || changes.departure !== old.departure || changes.returnDate !== old.returnDate;
    const trip = rebuild
      ? {
        ...enrichTrip({ ...changes, interests: old.interests || [] }, req.user.id, old.id),
        createdAt: old.createdAt,
        itineraryUpdate: { reason: "schedule", status: "pending" },
      }
      : updateTripEstimate({
        ...old,
        ...changes,
        includeFlights: Boolean(changes.includeFlights && getTripTransport(changes.origin, changes.destination)?.route),
        itineraryUpdate: old.itineraryUpdate?.reason === "budget" ? null : old.itineraryUpdate,
      });
    if (!await saveTripUpdate(trip, old)) return tripChanged(res);
    res.json({ trip, generateItinerary: rebuild });
  } catch (error) { next(error); }
});

router.post("/:id/generate", async (req, res, next) => {
  const trip = await getTrip(req.params.id, req.user.id);
  if (!trip) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip not found." } });
  const input = generationInput.safeParse(req.body ?? {});
  if (!input.success) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Choose a valid itinerary generation request." } });
  const { reason, updatedAt } = input.data;
  if (updatedAt !== undefined && updatedAt !== trip.updatedAt) return tripChanged(res);
  if (itineraryRequests.has(trip.id)) {
    return res.status(409).json({ error: { code: "GENERATION_IN_PROGRESS", message: "An itinerary update is already in progress. Check the workspace shortly." } });
  }
  itineraryRequests.add(trip.id);
  try {
    const current = trip.estimateBasis ? trip : updateTripEstimate({ ...trip });
    const { remaining, activities } = current.budgetBreakdown;
    if (reason === "budget" && remaining >= 0) return res.json({ trip: current });

    let updated = { ...current, itineraryUpdate: { reason, status: "failed" } };
    if (reason === "budget" && Math.round(remaining * 100) + Math.round(activities * 100) < 0) {
      updated.itineraryUpdate.status = "fixed-costs";
    } else {
      const result = await generateItinerary(current).catch(() => null);
      if (result?.provider === "google-gemini") {
        const { itinerary, provider, model, generatedAt, venueLookup } = result;
        if (venueLookup === false && current.itinerary.some(({ activities }) =>
          activities.some(({ placeId, venueSource }) => placeId || venueSource))) {
          updated.itineraryUpdate.status = "venues-unavailable";
        } else {
          const candidate = applyItinerary({ ...current, itineraryUpdate: null, status: "ready" }, itinerary, { provider, model, generatedAt, venueLookup });
          if (reason === "budget" && candidate.budgetBreakdown.remaining < 0) updated.itineraryUpdate.status = "unfit";
          else updated = candidate;
        }
      }
    }
    if (!await saveTripUpdate(updated, trip)) return tripChanged(res);
    res.json({ trip: updated });
  } catch (error) {
    next(error);
  } finally {
    itineraryRequests.delete(trip.id);
  }
});

router.post("/:id/refresh-conditions", async (req, res, next) => {
  try {
    const trip = await getTrip(req.params.id, req.user.id);
    if (!trip) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip not found." } });
    const conditions = await getTravelConditions(trip);
    const updated = { ...trip, conditions };
    if (!await saveTripUpdate(updated, trip)) return tripChanged(res);
    res.json({ trip: updated.estimateBasis ? updated : updateTripEstimate({ ...updated }) });
  } catch (error) { next(error); }
});

router.post("/:id/refresh-data", async (req, res) => {
  const trip = await getTrip(req.params.id, req.user.id);
  if (!trip) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip not found." } });
  try {
    const data = await refreshTravelData(trip);
    const updated = updateTripEstimate({ ...trip, offers: data.offers, conditions: data.conditions, providerStatus: data.providers });
    if (!await saveTripUpdate(updated, trip)) return tripChanged(res);
    res.json({ trip: updated });
  } catch (error) { res.status(502).json({ error: { code: "PROVIDER_REFRESH_FAILED", message: error.message } }); }
});

router.post("/:id/regenerate", async (req, res, next) => {
  try {
    const old = await getTrip(req.params.id, req.user.id);
    if (!old) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip not found." } });
    const currency = old.currency || tripCurrency;
    if (req.body?.currency !== undefined && req.body.currency !== currency) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Keep the saved trip’s original budget currency." } });
    }
    const input = { ...old, ...req.body, currency };
    const dateError = tripDateError(input, old);
    if (dateError) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: dateError } });
    const replacement = await saveTrip(enrichTrip(input, req.user.id));
    await deleteTrip(old.id, req.user.id);
    res.json({ trip: replacement });
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!await deleteTrip(req.params.id, req.user.id)) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip not found." } });
    res.status(204).end();
  } catch (error) { next(error); }
});

module.exports = router;
