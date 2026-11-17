export const interestOptions = [
  "Nature",
  "Culture",
  "Food",
  "Beach",
  "Adventure",
];
export const currencies = ["PHP", "USD", "EUR", "JPY"];

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString().slice(0, 10) === value
    ? timestamp
    : null;
}

export function createTripSummary(input, today) {
  const errors = {};
  const destination = String(input.destination || "").trim();
  const start = parseDate(input.departure || "");
  const end = parseDate(input.returnDate || "");
  const travelers = Number(input.travelers);
  const budget = Number(input.budget);
  if (!destination || destination.length > 100)
    errors.destination = "Enter a destination using 1–100 characters.";
  if (start === null || input.departure < today)
    errors.departure = "Choose today or a future departure date.";
  if (end === null || (start !== null && end < start))
    errors.returnDate = "Return date must be on or after departure.";
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > 99)
    errors.travelers = "Enter 1–99 travelers.";
  if (!Number.isFinite(budget) || budget <= 0 || budget > 1000000000)
    errors.budget = "Enter a positive total budget up to 1,000,000,000.";
  else {
    const minorUnitFactor = input.currency === "JPY" ? 1 : 100;
    if (Math.abs(budget * minorUnitFactor - Math.round(budget * minorUnitFactor)) > 0.000001)
      errors.budget = input.currency === "JPY"
        ? "Enter a whole-yen budget."
        : "Use no more than two decimal places for your budget.";
  }
  if (!currencies.includes(input.currency))
    errors.currency = "Choose a supported currency.";
  if (Object.keys(errors).length) return { errors, summary: null };
  const nights = Math.round((end - start) / 86400000);
  return {
    errors: {},
    summary: {
      destination,
      departure: input.departure,
      returnDate: input.returnDate,
      travelers,
      budget,
      currency: input.currency,
      nights,
      days: nights + 1,
      includeFlights: Boolean(input.includeFlights),
      interests: (input.interests || []).filter((value) =>
        interestOptions.includes(value),
      ),
    },
  };
}
