const router = require("express").Router();
const { requireAuth } = require("../middleware/auth.middleware");
const { enrichTrip, applyItinerary } = require("../store");
const { saveTrip, listTrips, getTrip, deleteTrip } = require("../services/trip-repository.service");
const { generateItinerary } = require("../services/itinerary.service");
const { refreshTravelData } = require("../services/travel-data.service");

const minimumBudgets = { PHP: 10000, USD: 20, EUR: 20, JPY: 3000 };

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
    const minimum = minimumBudgets[input.currency] || 1;
    if (!input.origin || !input.destination || !input.departure || !input.returnDate || !input.budget) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Origin, destination, dates, travelers, and budget are required." } });
    if (Number(input.budget) < minimum) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: `Budget must be at least ${minimum} ${input.currency || ""}.` } });
    const trip = await saveTrip(enrichTrip(input, req.user.id));
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
    const replacement = await saveTrip(enrichTrip({ ...old, ...req.body }, req.user.id));
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
