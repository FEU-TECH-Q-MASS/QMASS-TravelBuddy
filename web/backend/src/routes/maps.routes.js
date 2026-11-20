const router = require("express").Router();
const { requireAuth } = require("../middleware/requireAuth");
const { computeRoute, routeInputSchema } = require("../services/googleRoutes.service");

router.use(requireAuth);

router.post("/route", async (req, res, next) => {
  const parsed = routeInputSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "origin, destination, and up to 25 valid waypoints are required.",
      },
    });
  }

  try {
    return res.json({ route: await computeRoute(parsed.data) });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: { code: error.code || "MAPS_PROVIDER_ERROR", message: error.message },
      });
    }
    return next(error);
  }
});

module.exports = router;
