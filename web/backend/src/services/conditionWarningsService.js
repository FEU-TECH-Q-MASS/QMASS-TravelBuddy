
const OUTDOOR_KEYWORDS = [
  "hiking",
  "trekking",
  "island hopping",
  "boat tour",
  "beach",
  "snorkeling",
  "diving",
  "kayaking",
  "surfing",
  "walking tour",
  "outdoor",
  "viewpoint",
  "waterfall",
  "zipline",
];

const INDOOR_KEYWORDS = [
  "museum",
  "gallery",
  "cinema",
  "indoor",
  "shopping mall",
];

function isOutdoorActivity(activity) {
  if (typeof activity.isOutdoor === "boolean") {
    return activity.isOutdoor;
  }

  const title = String(activity.title || "").toLowerCase();

  if (INDOOR_KEYWORDS.some((word) => title.includes(word))) {
    return false;
  }

  return OUTDOOR_KEYWORDS.some((word) => title.includes(word));
}

function getActivityWarnings(itinerary, weather) {
  const warnings = [];

  if (!Array.isArray(itinerary)) return warnings;
  if (!Array.isArray(weather?.days)) return warnings;

  for (const day of itinerary) {
    if (!Array.isArray(day.activities)) continue;

    for (const activity of day.activities) {
      if (!isOutdoorActivity(activity)) continue;

      const forecasts = weather.days.filter(
        (entry) => entry.date === day.date
      );

      if (forecasts.length === 0) continue;

      const maxRainProbability = Math.max(
        ...forecasts
          .map((entry) => entry.rainProbability)
          .filter((value) =>
            typeof value === "number" &&
            value >= 0 &&
            value <= 1
          ),
        0
      );

      if (maxRainProbability >= 0.7) {
        warnings.push({
          code: "OUTDOOR_RAIN_RISK",
          severity: "moderate",
          activityId: activity.id,
          activityTitle: activity.title,
          date: day.date,
          message:
            `Rain may affect ${activity.title}. ` +
            "Consider checking conditions before proceeding.",
          sourceType: "forecast",
          rainProbability: maxRainProbability,
        });
      }
    }
  }

  return warnings;
}

module.exports = {
  isOutdoorActivity,
  getActivityWarnings,
};
