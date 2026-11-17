function getHealth(_req, res) {
  res.json({ status: "ok", service: "travelbuddy-api", version: "v1" });
}

module.exports = { getHealth };
