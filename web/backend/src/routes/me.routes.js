const router = require("express").Router();
const { getMe } = require("../controllers/me.controller");
const { requireAuth } = require("../middleware/requireAuth");

router.get("/", requireAuth, getMe);

module.exports = router;
