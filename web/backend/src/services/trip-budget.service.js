const { validateTripDates } = require("../../../shared/tripDates.cjs");

// Illustrative allowances in the saved trip currency. They are not converted quotes.
const allowances = {
  PHP: { airfare: 12000, room: 3500, meals: 900, vehicle: 500, activity: 500 },
  USD: { airfare: 220, room: 65, meals: 16, vehicle: 9, activity: 9 },
  EUR: { airfare: 200, room: 60, meals: 15, vehicle: 8, activity: 8 },
  JPY: { airfare: 33000, room: 9500, meals: 2500, vehicle: 1400, activity: 1400 },
};
const guestsPerRoom = 2;
const guestsPerVehicle = 4;

function getAllowances(currency) {
  return allowances[currency] || allowances.PHP;
}

function accommodationDetails(trip) {
  const { nights } = validateTripDates(trip.departure, trip.returnDate);
  return { nights: Math.max(0, nights ?? trip.itinerary.length - 1), rooms: Math.ceil(trip.travelers / guestsPerRoom) };
}

function priceHotelEstimates(trip, hotels) {
  const { rooms, nights } = accommodationDetails(trip);
  return hotels
    .filter((hotel) => hotel?.currency === trip.currency && Number.isFinite(hotel.nightlyRate) && hotel.nightlyRate > 0)
    .map((hotel) => ({
      ...hotel,
      rooms,
      nights,
      totalStay: Math.round(hotel.nightlyRate * 100) * rooms * nights / 100,
    }));
}

function updateTripEstimate(trip) {
  const { nights, rooms } = accommodationDetails(trip);
  const travelers = Number(trip.travelers) || 1;
  const rates = getAllowances(trip.currency);
  const hotels = priceHotelEstimates(trip, trip.offers?.hotels || []);
  const hotel = hotels.reduce((lowest, option) => !lowest || option.totalStay < lowest.totalStay ? option : lowest, null);
  const vehicles = Math.ceil(travelers / guestsPerVehicle);
  const days = nights + 1;
  const activityCents = trip.itinerary.reduce((sum, day) => sum + day.activities.reduce(
    (daySum, activity) => daySum + Math.round((Number(activity.cost) || 0) * 100), 0,
  ), 0);
  const costs = {
    flights: trip.includeFlights ? rates.airfare * travelers * 100 : 0,
    accommodation: hotel ? Math.round(hotel.totalStay * 100) : rates.room * rooms * nights * 100,
    activities: activityCents * travelers,
    meals: rates.meals * travelers * days * 100,
    transportation: rates.vehicle * vehicles * days * 100,
  };
  const totalCents = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
  trip.offers = { ...trip.offers, hotels };
  trip.budgetBreakdown = {
    ...Object.fromEntries(Object.entries(costs).map(([key, cents]) => [key, cents / 100])),
    estimatedTotal: totalCents / 100,
    remaining: (Math.round(Number(trip.budget) * 100) - totalCents) / 100,
    currency: trip.currency,
  };
  trip.estimateBasis = { rooms, nights, vehicles, guestsPerRoom, guestsPerVehicle, hotelId: nights ? hotel?.id : null };
  return trip;
}

module.exports = { getAllowances, priceHotelEstimates, updateTripEstimate };
