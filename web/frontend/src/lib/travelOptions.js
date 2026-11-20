import catalog from "../../../shared/destinations.cjs";
import transport from "../../../shared/transport.cjs";
import photoCredits from "./destinationPhotoCredits.json" with { type: "json" };

export const { getTripTransport } = transport;
export const { findDestination, findTripDestination } = catalog;

export const palawanOptions = catalog.destinations.filter((place) => place.parent === "PAL");

export const airportOptions = catalog.destinations
  .filter((place) => place.airport)
  .map(({ airport, airportName, name }) => [airport, `${name} · ${airportName} (${airport})`])
  .sort((first, second) => first[1].localeCompare(second[1]));

export const originOptions = [...airportOptions, ["BAN", "Banaue"]];

export const destinationOptions = catalog.destinations
  .filter((place) => !place.parent)
  .map(({ code, name, airport, airportName }) => [
    code, name,
    code === "PAL" ? palawanOptions.map((base) => `${base.name} ${base.airport} ${base.airportName}`).join(" ") : `${airport || ""} ${airportName || ""}`,
  ])
  .sort((first, second) => first[1].localeCompare(second[1]));

export const nationwideDestinationOptions = [
  ...destinationOptions,
  ...catalog.localDestinations.map(({ code, name }) => [code, name])
    .sort((first, second) => first[1].localeCompare(second[1], "en-PH")),
];

function normalizePhotoDestination(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s*,\s*/g, ", ").replace(/, philippines$/, "");
}

const destinationsByPhotoLabel = new Map(catalog.destinations.flatMap((place) =>
  [place.slug, place.name, catalog.destinationLocation(place.code)].map((label) =>
    [normalizePhotoDestination(label), place],
  ),
));

export function destinationImage(value) {
  const place = findDestination(value) || destinationsByPhotoLabel.get(normalizePhotoDestination(value));
  return place && photoCredits[place.slug] ? `/images/destinations/${place.slug}.webp` : null;
}

export function resolveTravelLocation(value) {
  const location = String(value || "").trim();
  return catalog.destinationLocation(location);
}

export function orderedRouteLocations(values) {
  return values
    .map(resolveTravelLocation)
    .filter(Boolean)
    .filter((value, index, locations) => value.toLowerCase() !== locations[index - 1]?.toLowerCase());
}
