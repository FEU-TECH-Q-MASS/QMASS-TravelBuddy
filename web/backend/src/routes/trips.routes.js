const router = require("express").Router();
const { requireAuth } = require("../middleware/auth.middleware");
const { trips, enrichTrip, applyItinerary } = require("../store");
const { generateItinerary } = require("../services/itinerary.service");
const { refreshTravelData } = require("../services/travel-data.service");
const minimumBudgets = { PHP: 10000, USD: 20, EUR: 20, JPY: 3000 };
router.get("/", (req, res, next) => {
  // Preserve the scaffold's unknown-route behavior for anonymous probes while
  // keeping the actual trip collection private to authenticated users.
  if (!req.headers.authorization) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Endpoint not found." } });
  requireAuth(req, res, next);
}, (req, res) => {
  // Future database-backed handlers must always filter by req.user.id.
  res.json({ trips: [...trips.values()].filter((trip) => trip.ownerId === req.user.id) });
});
router.use(requireAuth);
router.post("/", (req, res) => { const input = req.body || {}; const minimum = minimumBudgets[input.currency] || 1; if (!input.origin || !input.destination || !input.departure || !input.returnDate || !input.budget) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Origin, destination, dates, travelers, and budget are required." } }); if (Number(input.budget) < minimum) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: `Budget must be at least ${minimum} ${input.currency || ""}.` } }); res.status(201).json({ trip: enrichTrip(input, req.user.id) }); });
router.get("/:id", (req, res) => { const trip = trips.get(req.params.id); if (!trip || trip.ownerId !== req.user.id) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip not found." } }); res.json({ trip }); });
router.post("/:id/generate", async (req, res) => { const trip = trips.get(req.params.id); if (!trip || trip.ownerId !== req.user.id) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip not found." } }); trip.status = "generating"; try { const result = await generateItinerary(trip); applyItinerary(trip, result.itinerary, { provider: result.provider, model: result.model, generatedAt: result.generatedAt }); trip.status = "ready"; res.json({ trip }); } catch (error) { trip.status = "ready"; res.status(502).json({ error: { code: "GENERATION_FAILED", message: error.message || "Itinerary generation failed." } }); } });
router.post("/:id/refresh-data", async (req, res) => { const trip = trips.get(req.params.id); if (!trip || trip.ownerId !== req.user.id) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip not found." } }); try { const data = await refreshTravelData({ ...trip, ...req.body }); trip.offers = data.offers; trip.conditions = data.conditions; trip.providerStatus = data.providers; trip.updatedAt = new Date().toISOString(); res.json({ trip }); } catch (error) { res.status(502).json({ error: { code: "PROVIDER_REFRESH_FAILED", message: error.message } }); } });
router.post("/:id/regenerate", (req, res) => { const old = trips.get(req.params.id); if (!old || old.ownerId !== req.user.id) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip not found." } }); const replacement = enrichTrip({ ...old, ...req.body }, req.user.id); trips.delete(old.id); res.json({ trip: replacement }); });
router.delete("/:id", (req, res) => { const trip = trips.get(req.params.id); if (!trip || trip.ownerId !== req.user.id) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip not found." } }); trips.delete(req.params.id); res.status(204).end(); });
module.exports = router;
