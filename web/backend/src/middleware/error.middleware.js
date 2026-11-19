function notFound(_req, res) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Endpoint not found." } });
}

function errorHandler(error, _req, res, _next) {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } });
  }
  if (error.type === "entity.too.large") {
    return res.status(413).json({ error: { code: "PAYLOAD_TOO_LARGE", message: "Request body exceeds the size limit." } });
  }
  // Avoid logging request bodies, credentials, or provider response contents.
  console.error("TravelBuddy API encountered an unexpected server error:", error.message || error);
  const message = process.env.NODE_ENV === "development" ? (error.message || "Unexpected server error.") : "An unexpected error occurred.";
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message } });
}

module.exports = { notFound, errorHandler };
