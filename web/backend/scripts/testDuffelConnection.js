
const path = require("node:path");
const { loadEnvFile } = require("node:process");

loadEnvFile(path.join(__dirname, "../.env"));

async function testDuffelConnection() {
  const token = process.env.DUFFEL_ACCESS_TOKEN;

  if (!token || !token.startsWith("duffel_test_")) {
    console.error("Missing or invalid Duffel test token.");
    process.exitCode = 1;
    return;
  }

  const baseUrl = process.env.DUFFEL_BASE_URL
    || "https://api.duffel.com";

  const departureDate = "2027-02-15";

  console.log("Testing Duffel Sandbox connection...");

  try {
    const response = await fetch(
      `${baseUrl}/air/offer_requests`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Duffel-Version": "v2",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          data: {
            slices: [
              {
                origin: "MNL",
                destination: "CEB",
                departure_date: departureDate,
              },
            ],
            passengers: [
              { type: "adult" },
            ],
            cabin_class: "economy",
          },
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    console.log("HTTP Status:", response.status);

    const result = await response.json();

    if (!response.ok) {
      console.error("Duffel returned an error.");

      for (const error of result.errors || []) {
        console.error(
          `${error.code}: ${error.message}`
        );
      }

      process.exitCode = 1;
      return;
    }

    console.log("SUCCESS: Connected to Duffel!");
    console.log(
      "Offer Request ID:",
      result.data?.id
    );
    console.log(
      "Number of offers:",
      result.data?.offers?.length ?? 0
    );

    for (const offer of
      (result.data?.offers || []).slice(0, 3)) {
      console.log({
        id: offer.id,
        amount: offer.total_amount,
        currency: offer.total_currency,
      });
    }
  } catch (error) {
    console.error(
      "Connection failed:",
      error.message
    );
    process.exitCode = 1;
  }
}

testDuffelConnection();
