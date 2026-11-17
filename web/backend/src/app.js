const express = require("express");
const healthRoutes = require("./routes/health.routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use("/api/v1/health", healthRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
