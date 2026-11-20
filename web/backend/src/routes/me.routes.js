const router = require("express").Router();
const { getMe, updateMe } = require("../controllers/me.controller");
const { requireAuth } = require("../middleware/requireAuth");

router.get("/", requireAuth, getMe);
router.patch("/", requireAuth, updateMe);

module.exports = router;
