const express = require("express");
const healthRoutes = require("./routes/health.routes");
const tripsRoutes = require("./routes/trips.routes");
const notificationsRoutes = require("./routes/notifications.routes");
const adminRoutes = require("./routes/admin.routes");
const meRoutes = require("./routes/me.routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/me", meRoutes);
app.use("/api/v1/trips", tripsRoutes);
app.use("/api/v1/notifications", notificationsRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
