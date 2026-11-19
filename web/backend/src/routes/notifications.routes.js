const router = require("express").Router();
const { requireAuth } = require("../middleware/auth.middleware");
const { notifications, id } = require("../store");
router.use(requireAuth);
router.get("/", (req, res) => res.json({ notifications: [...notifications.values()].filter((item) => item.userId === req.user.id) }));
router.post("/", (req, res) => { const item = { id: id("notification"), userId: req.user.id, title: req.body?.title || "TravelBuddy alert", message: req.body?.message || "Your travel update is ready.", read: false, createdAt: new Date().toISOString() }; notifications.set(item.id, item); res.status(201).json({ notification: item }); });
router.patch("/:id/read", (req, res) => { const item = notifications.get(req.params.id); if (!item || item.userId !== req.user.id) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Notification not found." } }); item.read = true; res.json({ notification: item }); });
module.exports = router;
