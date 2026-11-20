import tripNumbers from "../../../shared/tripNumbers.cjs";
import tripDates from "../../../shared/tripDates.cjs";

export const { tripCurrency, minimumBudgets, maxTravelers, validateTravelers, validateBudget } = tripNumbers;
export const { lastTripDate, maxTripDays, todayInPhilippines } = tripDates;

export const interestOptions = [
  "Nature",
  "Culture",
  "Food",
  "Beach",
  "Adventure",
];

export function createTripSummary(input, today = todayInPhilippines()) {
  const { errors, nights } = tripDates.validateTripDates(input.departure, input.returnDate, today);
  const destination = String(input.destination || "").trim();
  if (!destination || destination.length > 100)
    errors.destination = "Enter a destination using 1–100 characters.";
  const travelers = validateTravelers(input.travelers);
  if (travelers.error) errors.travelers = travelers.error;
  const budget = validateBudget(input.budget, input.currency);
  if (budget.error) errors.budget = budget.error;
  if (Object.keys(errors).length) return { errors, summary: null };
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
