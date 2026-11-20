
const {
  createOfferRequest,
  duffelRequest,
  getOffer,
} = require("./duffel.service");

const {
  getTripTransport,
} = require("../../../shared/transport.cjs");

class FlightSearchError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "FlightSearchError";
    this.status = status;
  }
}

// Normalize included baggage allowances
function normalizeBaggage(passengers = []) {
  const baggageItems = passengers.flatMap(
    (passenger) => passenger.baggages || []
  );

  const normalizeItems = (items) =>
    items.map((item) => ({
      quantity: item.quantity ?? null,
      ...(item.max_weight_kg != null
        ? { maxWeightKg: item.max_weight_kg }
        : {}),
    }));

  return {
    cabin: normalizeItems(
      baggageItems.filter(
        (item) => item.type === "carry_on"
      )
    ),

    checked: normalizeItems(
      baggageItems.filter(
        (item) => item.type === "checked"
      )
    ),

    informationAvailable: baggageItems.length > 0,
  };
}

// Normalize a seat's available services
function normalizeSeatServices(services = []) {
  return services.map((service) => ({
    id: service.id ?? null,
    type: service.type ?? null,
    passengerId: service.passenger_id ?? null,
    totalAmount: service.total_amount ?? null,
    totalCurrency: service.total_currency ?? null,
  }));
}

// Normalize Duffel seat maps for frontend display
function normalizeSeatMaps(seatMaps = []) {
  return seatMaps.map((seatMap) => ({
    id: seatMap.id ?? null,

    segmentId: seatMap.segment_id ?? null,

    cabins: (seatMap.cabins || []).map((cabin) => ({
      cabinClass: cabin.cabin_class ?? null,

      aisles: cabin.aisles ?? null,

      rows: (cabin.rows || []).map((row) => ({
        sections: (row.sections || []).map((section) => ({
          elements: (section.elements || []).map((element) => {
            if (element.type !== "seat") {
              return {
                type: element.type,
              };
            }

            const services = normalizeSeatServices(
              element.available_services || []
            );

            return {
              type: "seat",

              designator:
                element.designator ?? null,

              name: element.name ?? null,

              disclosures:
                element.disclosures || [],

              availableServices: services,

              // Indicates whether Duffel offers
              // a seat-selection service here.
              selectable: services.length > 0,
            };
          }),
        })),
      })),
    })),
  }));
}

// Search available flights for a TravelBuddy trip
async function searchTripFlights(trip) {
  if (!trip.includeFlights) {
    throw new FlightSearchError(
      "Flights are not enabled for this trip."
    );
  }

  const transport = getTripTransport(
    trip.origin,
    trip.destination
  );

  if (!transport?.route) {
    throw new FlightSearchError(
      "No supported flight route is configured for this trip."
    );
  }

  const [origin, destination] = transport.route;

  if (
    !/^[A-Z]{3}$/.test(origin) ||
    !/^[A-Z]{3}$/.test(destination)
  ) {
    throw new FlightSearchError(
      "The trip does not have valid airport codes."
    );
  }

  const travelers = Number(trip.travelers);

  if (
    !Number.isInteger(travelers) ||
    travelers < 1 ||
    travelers > 9
  ) {
    throw new FlightSearchError(
      "Flight searches support 1 to 9 adult passengers."
    );
  }

  const result = await createOfferRequest({
    origin,
    destination,
    departureDate: trip.departure,
    returnDate: trip.returnDate,
    passengers: travelers,
    cabinClass: "economy",
  });

  const offers = result.data?.offers || [];

  return {
    sandbox: true,
    provider: "duffel",

    offerRequestId: result.data?.id,

    search: {
      origin,
      destination,
      departureDate: trip.departure,
      returnDate: trip.returnDate,
      passengers: travelers,
      cabinClass: "economy",
    },

    offers: offers.map((offer) => ({
      id: offer.id,

      totalAmount: offer.total_amount,
      totalCurrency: offer.total_currency,

      baseAmount: offer.base_amount,
      baseCurrency: offer.base_currency,

      expiresAt: offer.expires_at,

      slices: (offer.slices || []).map((slice) => ({
        origin: slice.origin?.iata_code,
        destination: slice.destination?.iata_code,
        duration: slice.duration,

        segments: (slice.segments || []).map(
          (segment) => ({
            id: segment.id ?? null,

            origin: segment.origin?.iata_code,
            destination: segment.destination?.iata_code,

            departingAt: segment.departing_at,
            arrivingAt: segment.arriving_at,

            flightNumber:
              `${segment.marketing_carrier?.iata_code || ""}${segment.marketing_carrier_flight_number || ""}`,

            airline: segment.marketing_carrier?.name,

            duration: segment.duration,

            baggage: normalizeBaggage(
              segment.passengers || []
            ),
          })
        ),
      })),

      passengers: (offer.passengers || []).map(
        (passenger) => ({
          passengerId: passenger.id,
          cabinClass: passenger.cabin_class,
          baggages: passenger.baggages || [],
        })
      ),

      seatMapsSupported: null,
    })),
  };
}

// Retrieve seat maps for a selected Duffel offer
async function getFlightSeatMaps(offerId) {
  if (
    typeof offerId !== "string" ||
    !/^off_[A-Za-z0-9]+$/.test(offerId)
  ) {
    throw new FlightSearchError(
      "Invalid Duffel flight offer ID."
    );
  }

  const result = await duffelRequest(
    "/air/seat_maps",
    {
      method: "GET",
      query: {
        offer_id: offerId,
      },
    }
  );

  const seatMaps = result.data || [];

  if (!Array.isArray(seatMaps)) {
    throw new FlightSearchError(
      "Duffel returned an unexpected seat map response.",
      502
    );
  }

  return {
    sandbox: true,
    provider: "duffel",
    offerId,

    seatMapsAvailable: seatMaps.length > 0,

    seatMaps: normalizeSeatMaps(seatMaps),
  };
}


async function verifyFlightOffer(offerId) {
  // Validate Duffel offer identifier
  if (
    typeof offerId !== "string" ||
    !/^off_[A-Za-z0-9]+$/.test(offerId)
  ) {
    throw new FlightSearchError(
      "Invalid Duffel flight offer ID.",
      400
    );
  }

  // Retrieve latest offer details from Duffel
  const result = await getOffer(offerId);
  const offer = result.data;

  if (!offer || offer.id !== offerId) {
    throw new FlightSearchError(
      "Flight offer could not be verified.",
      502
    );
  }

  // Check offer expiration
  const expiresAt = offer.expires_at ?? null;
  const expiryTime = expiresAt
    ? Date.parse(expiresAt)
    : NaN;

  const expirationKnown = Number.isFinite(expiryTime);

  const expired = expirationKnown
    ? expiryTime <= Date.now()
    : null;

  // Do not treat an unknown expiration as valid
  const valid = expired === false;

  return {
    sandbox: true,
    provider: "duffel",

    offerId: offer.id,

    valid,
    expired,
    expirationKnown,

    status: valid
      ? "VALID"
      : expired === true
        ? "EXPIRED"
        : "UNKNOWN",

    price: {
      totalAmount: offer.total_amount,
      totalCurrency: offer.total_currency,
      baseAmount: offer.base_amount,
      baseCurrency: offer.base_currency,
    },

    expiresAt,

    verifiedAt: new Date().toISOString(),

    message: valid
      ? "Flight offer retrieved and is not expired."
      : expired === true
        ? "This flight offer has expired. Search again."
        : "Offer expiration could not be verified.",
  };
}


module.exports = {
  FlightSearchError,
  searchTripFlights,
  getFlightSeatMaps,
  verifyFlightOffer,
  normalizeBaggage,
  normalizeSeatMaps,
};
