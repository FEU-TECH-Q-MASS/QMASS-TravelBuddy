const maxTripDays = 14;
const dayMs = 86400000;
const philippinesDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" });

function parseDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value ? timestamp : null;
}

function todayInPhilippines() {
  return philippinesDate.format(new Date());
}

function lastTripDate(departure) {
  const start = parseDate(departure);
  return start === null ? undefined : new Date(start + (maxTripDays - 1) * dayMs).toISOString().slice(0, 10);
}

function validateTripDates(departure, returnDate, earliestDeparture) {
  const start = parseDate(departure);
  const end = parseDate(returnDate);
  const errors = {};
  if (start === null || (earliestDeparture && departure < earliestDeparture)) {
    errors.departure = earliestDeparture ? "Choose today or a future departure date." : "Choose a valid departure date.";
  }
  if (end === null || (start !== null && end < start)) {
    errors.returnDate = "Return date must be on or after departure.";
  } else if (start !== null && end - start >= maxTripDays * dayMs) {
    errors.returnDate = `Trips can be up to ${maxTripDays} days, including the departure and return days.`;
  }
  return { errors, nights: start === null || end === null ? null : (end - start) / dayMs };
}

module.exports = { dayMs, lastTripDate, maxTripDays, todayInPhilippines, validateTripDates };
