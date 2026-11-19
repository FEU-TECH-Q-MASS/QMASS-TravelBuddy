const router = require("express").Router();
const { requireAuth } = require("../middleware/auth.middleware");
const { trips, enrichTrip } = require("../store");
router.get("/", (req, res, next) => {
  // Preserve the scaffold's unknown-route behavior for anonymous probes while
  // keeping the actual trip collection private to authenticated users.
  if (!req.headers.authorization) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Endpoint not found." } });
  requireAuth(req, res, next);
}, (req, res) => res.json({ trips: [...trips.values()].filter((trip) => trip.ownerId === req.user.id) }));
router.use(requireAuth);
router.post("/", (req, res) => { const input = req.body || {}; if (!input.destination || !input.departure || !input.returnDate || !input.budget) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Destination, dates, travelers, and budget are required." } }); res.status(201).json({ trip: enrichTrip(input, req.user.id) }); });
router.get("/:id", (req, res) => { const trip = trips.get(req.params.id); if (!trip || trip.ownerId !== req.user.id) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip not found." } }); res.json({ trip }); });
router.post("/:id/regenerate", (req, res) => { const old = trips.get(req.params.id); if (!old || old.ownerId !== req.user.id) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip not found." } }); const replacement = enrichTrip({ ...old, ...req.body }, req.user.id); trips.delete(old.id); res.json({ trip: replacement }); });
router.delete("/:id", (req, res) => { const trip = trips.get(req.params.id); if (!trip || trip.ownerId !== req.user.id) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Trip not found." } }); trips.delete(req.params.id); res.status(204).end(); });
module.exports = router;
