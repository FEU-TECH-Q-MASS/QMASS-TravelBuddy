const express = require("express");
const healthRoutes = require("./routes/health.routes");
const tripsRoutes = require("./routes/trips.routes");
const notificationsRoutes = require("./routes/notifications.routes");
const { createAdminRouter } = require("./routes/admin.routes");
const { createContactRouter } = require("./routes/support.routes");
const meRoutes = require("./routes/me.routes");
const mapsRoutes = require("./routes/maps.routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/me", meRoutes);
app.use("/api/v1/maps", mapsRoutes);
app.use("/api/v1/trips", tripsRoutes);
app.use("/api/v1/notifications", notificationsRoutes);
app.use("/api/v1/admin", createAdminRouter());
app.use("/api/v1/contact", createContactRouter());
app.use(notFound);
app.use(errorHandler);

module.exports = app;
