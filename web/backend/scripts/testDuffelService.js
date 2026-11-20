
const {
  createOfferRequest,
  getOffer,
} = require("../src/services/duffel.service");

async function test() {
  console.log("=== MODULE 7: DUFFEL SERVICE TEST ===");

  try {
    console.log("\n1. Searching for flights...");

    const result = await createOfferRequest({
      origin: "MNL",
      destination: "CEB",
      departureDate: "2027-02-15",
      passengers: 1,
      cabinClass: "economy",
    });

    const data = result.data;
    const offers = data?.offers || [];

    console.log("Offer Request ID:", data?.id);
    console.log("Offers returned:", offers.length);

    if (offers.length === 0) {
      console.log(
        "Connection successful, but no offers found."
      );
      return;
    }

    console.log("\n2. Displaying first offer...");

    const firstOffer = offers[0];

    console.log({
      id: firstOffer.id,
      amount: firstOffer.total_amount,
      currency: firstOffer.total_currency,
      seats: firstOffer.available_services?.length,
    });

    console.log("\n3. Retrieving offer details...");

    const offerResult = await getOffer(firstOffer.id);

    console.log("Retrieved offer:", offerResult.data?.id);
    console.log(
      "Latest price:",
      offerResult.data?.total_amount,
      offerResult.data?.total_currency
    );

    console.log("\nDUFFEL SERVICE TEST PASSED");

  } catch (error) {
    console.error("\nDUFFEL SERVICE TEST FAILED");
    console.error("Message:", error.message);
    console.error("Status:", error.status);

    if (error.details?.length) {
      console.error("Details:", error.details);
    }

    process.exitCode = 1;
  }
}

test();
