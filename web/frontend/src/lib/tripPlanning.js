import tripNumbers from "../../../shared/tripNumbers.cjs";

export const { tripCurrency, minimumBudgets, maxTravelers, validateTravelers, validateBudget } = tripNumbers;

export const interestOptions = [
  "Nature",
  "Culture",
  "Food",
  "Beach",
  "Adventure",
];

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
  if (!destination || destination.length > 100)
    errors.destination = "Enter a destination using 1–100 characters.";
  if (start === null || input.departure < today)
    errors.departure = "Choose today or a future departure date.";
  if (end === null || (start !== null && end < start))
    errors.returnDate = "Return date must be on or after departure.";
  const travelers = validateTravelers(input.travelers);
  if (travelers.error) errors.travelers = travelers.error;
  const budget = validateBudget(input.budget, input.currency);
  if (budget.error) errors.budget = budget.error;
  if (Object.keys(errors).length) return { errors, summary: null };
  const nights = Math.round((end - start) / 86400000);
  return {
    errors: {},
    summary: {
      destination,
      departure: input.departure,
      returnDate: input.returnDate,
      travelers: travelers.value,
      budget: budget.value,
      currency: tripCurrency,
      nights,
      days: nights + 1,
      includeFlights: Boolean(input.includeFlights),
      interests: (input.interests || []).filter((value) =>
        interestOptions.includes(value),
      ),
    },
  };
}
