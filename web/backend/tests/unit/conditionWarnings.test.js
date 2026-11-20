
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getActivityWarnings,
} = require("../../src/services/conditionWarningsService");

const itinerary = [
  {
    day: 1,
    date: "2026-11-21",
    activities: [
      {
        id: "activity-1",
        title: "Island Hopping",
        time: "09:00",
      },
      {
        id: "activity-2",
        title: "Museum Visit",
        time: "14:00",
      },
    ],
  },
];

test("warns outdoor activities when rain risk is high", () => {
  const weather = {
    days: [
      {
        date: "2026-11-21",
        rainProbability: 0.85,
      },
    ],
  };

  const warnings = getActivityWarnings(
    itinerary,
    weather
  );

  assert.equal(warnings.length, 1);
  assert.equal(
    warnings[0].code,
    "OUTDOOR_RAIN_RISK"
  );
  assert.equal(
    warnings[0].activityId,
    "activity-1"
  );
});

test("does not warn when rain probability is low", () => {
  const weather = {
    days: [
      {
        date: "2026-11-21",
        rainProbability: 0.2,
      },
    ],
  };

  const warnings = getActivityWarnings(
    itinerary,
    weather
  );

  assert.equal(warnings.length, 0);
});

test("does not warn when forecast data is missing", () => {
  const warnings = getActivityWarnings(
    itinerary,
    { days: [] }
  );

  assert.equal(warnings.length, 0);
});

test("does not warn indoor activities", () => {
  const indoorItinerary = [
    {
      date: "2026-11-21",
      activities: [
        {
          id: "activity-3",
          title: "Museum Visit",
        },
      ],
    },
  ];

  const warnings = getActivityWarnings(
    indoorItinerary,
    {
      days: [
        {
          date: "2026-11-21",
          rainProbability: 0.9,
        },
      ],
    }
  );

  assert.equal(warnings.length, 0);
});
