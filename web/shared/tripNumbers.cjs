const minimumBudgets = { PHP: 0.01, USD: 20, EUR: 20, JPY: 3000 };
const currencies = Object.keys(minimumBudgets);
const tripCurrency = "PHP";
const maxTravelers = 50;

function numberText(input) {
  return typeof input === "string" || typeof input === "number" ? String(input).trim() : "";
}

function validateTravelers(input) {
  const text = numberText(input);
  if (!text) return { error: "Enter the number of travelers." };
  if (!/^-?\d+$/.test(text)) return { error: "Enter a whole number of travelers." };
  const value = Number(text);
  if (value < 1 || value > maxTravelers) return { error: `Enter 1–${maxTravelers} travelers.` };
  return { value };
}

function validateBudget(input, currency = tripCurrency) {
  if (currency !== tripCurrency) return { error: "New trip budgets use Philippine pesos (PHP)." };
  const text = numberText(input);
  if (!text) return { error: "Enter a total trip budget." };
  if (!/^-?(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?|\.\d+)$/.test(text)) {
    return { error: "Enter a valid amount, such as 20,000." };
  }

  const normalized = text.replaceAll(",", "");
  const value = Number(normalized);
  if (value <= 0) return { error: "Enter a budget greater than ₱0." };
  const [whole, fraction = ""] = normalized.split(".");
  const significantFraction = fraction.replace(/0+$/, "");
  if (significantFraction.length > 2) return { error: "Use no more than two decimal places." };
  const amount = `${Number(whole)}.${significantFraction.padEnd(2, "0")}`;
  if (!Number.isSafeInteger(Math.round(value * 100)) || value.toFixed(2) !== amount) {
    return { error: "Enter a smaller budget amount." };
  }
  return { value };
}

module.exports = { currencies, tripCurrency, minimumBudgets, maxTravelers, validateTravelers, validateBudget };
