const router = require("express").Router();
const { requireAuth } = require("../middleware/auth.middleware");
const { enrichTrip, applyItinerary } = require("../store");
const { saveTrip, listTrips, getTrip, deleteTrip } = require("../services/trip-repository.service");
const { generateItinerary } = require("../services/itinerary.service");
const { refreshTravelData } = require("../services/travel-data.service");
const { getTravelConditions } = require("../services/travelConditionsService");
const { z } = require("zod");
const { findDestination } = require("../../../shared/destinations.cjs");
const { currencies, tripCurrency, minimumBudgets, maxTravelers, validateTravelers, validateBudget } = require("../../../shared/tripNumbers.cjs");

function resolveTripLocations(input, previous) {
  const origin = findDestination(input.origin);
  const destination = findDestination(input.destination);
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
}).refine((input) => input.returnDate >= input.departure, "Return date must be on or after departure.")
  .refine((input) => (Date.parse(input.returnDate) - Date.parse(input.departure)) / 86400000 < 14, "Trips can be up to 14 days.")
  .transform((input, context) => {
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

router.post("/", async (req, res, next) => {
  try {
    const input = req.body || {};
    if (!input.origin || !input.destination || !input.departure || !input.returnDate) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Origin, destination, and dates are required." } });
    const travelers = validateTravelers(input.travelers);
    const budget = validateBudget(input.budget, input.currency);
    const numberError = travelers.error || budget.error;
    if (numberError) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: numberError } });
    const locations = resolveTripLocations(input);
    if (locations.error) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: locations.error } });
    const trip = await saveTrip(enrichTrip({ ...input, ...locations, travelers: travelers.value, budget: budget.value, currency: tripCurrency }, req.user.id));
    res.status(201).json({ trip });
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const trip = await getTrip(req.params.id, req.user.id);
    if (!trip) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip not found." } });
    res.json({ trip });
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
    const locations = resolveTripLocations(parsed.data, old);
    if (locations.error) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: locations.error } });
    const trip = enrichTrip({ ...parsed.data, ...locations, interests: old.interests || [] }, req.user.id, old.id);
    trip.createdAt = old.createdAt;
    await saveTrip(trip);
    res.json({ trip });
  } catch (error) { next(error); }
});

router.post("/:id/generate", async (req, res) => {
  const trip = await getTrip(req.params.id, req.user.id);
  if (!trip) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip not found." } });
  trip.status = "generating";
  try {
    const result = await generateItinerary(trip);
    applyItinerary(trip, result.itinerary, { provider: result.provider, model: result.model, generatedAt: result.generatedAt });
    trip.status = "ready";
    await saveTrip(trip);
    res.json({ trip });
  } catch (error) {
    trip.status = "ready";
    await saveTrip(trip);
    res.status(502).json({ error: { code: "GENERATION_FAILED", message: error.message || "Itinerary generation failed." } });
  }
});

router.post("/:id/refresh-conditions", async (req, res, next) => {
  try {
    const trip = await getTrip(req.params.id, req.user.id);
    if (!trip) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip not found." } });
    const conditions = await getTravelConditions(trip);
    const updated = { ...trip, conditions, updatedAt: new Date().toISOString() };
    await saveTrip(updated);
    res.json({ trip: updated });
  } catch (error) { next(error); }
});

router.post("/:id/refresh-data", async (req, res) => {
  const trip = await getTrip(req.params.id, req.user.id);
  if (!trip) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip not found." } });
  try {
    const data = await refreshTravelData({ ...trip, ...req.body });
    trip.offers = data.offers;
    trip.conditions = data.conditions;
    trip.providerStatus = data.providers;
    trip.updatedAt = new Date().toISOString();
    await saveTrip(trip);
    res.json({ trip });
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
    const replacement = await saveTrip(enrichTrip({ ...old, ...req.body, currency }, req.user.id));
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
