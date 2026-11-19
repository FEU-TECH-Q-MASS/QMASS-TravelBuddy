const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middleware/auth.middleware");
const { users, publicUser } = require("../store");
router.use(requireAuth, requireAdmin);
router.get("/users", (_req, res) => res.json({ users: [...users.values()].map(publicUser) }));
router.patch("/users/:id", (req, res) => { const user = users.get(req.params.id); if (!user) return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found." } }); if (req.body.role && ["traveler", "admin"].includes(req.body.role)) user.role = req.body.role; if (typeof req.body.active === "boolean") user.active = req.body.active; res.json({ user: publicUser(user) }); });
module.exports = router;
