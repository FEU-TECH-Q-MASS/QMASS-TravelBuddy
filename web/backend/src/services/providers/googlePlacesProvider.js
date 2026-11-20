const searchUrl = "https://places.googleapis.com/v1/places:searchText";
const detailsUrl = "https://places.googleapis.com/v1/places/";

function configuredKey() {
  return process.env.GOOGLE_PLACES_API_KEY?.trim();
}

async function placesRequest(url, fieldMask, signal, body) {
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": configuredKey(),
      "X-Goog-FieldMask": fieldMask,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  if (!response.ok) throw new Error(`Places request failed with status ${response.status}.`);
  return response.json();
}

async function searchPlaces(query, signal) {
  const fields = "id,types,location,addressComponents,businessStatus";
  const result = await placesRequest(searchUrl, fields.split(",").map((field) => `places.${field}`).join(","), signal, {
    ...query, regionCode: "PH", languageCode: "en", pageSize: 12,
  });
  return result.places || [];
}

async function getPlaceDetails(placeId, signal) {
  const place = await placesRequest(
    detailsUrl + encodeURIComponent(placeId),
    "displayName,formattedAddress,businessStatus,attributions", signal,
  );
  if (!place.displayName?.text || place.businessStatus?.startsWith("CLOSED")) return null;
  return {
    name: place.displayName.text,
    address: place.formattedAddress || "",
    attributions: (place.attributions || []).filter(({ provider }) => provider),
  };
}

module.exports = { configuredKey, searchPlaces, getPlaceDetails };
