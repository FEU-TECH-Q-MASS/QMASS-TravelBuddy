import catalog from "../../../shared/destinations.cjs";
import transport from "../../../shared/transport.cjs";
import photoCredits from "./destinationPhotoCredits.json" with { type: "json" };

export const { getTripTransport } = transport;
export const { findDestination } = catalog;

export const palawanOptions = catalog.destinations.filter((place) => place.parent === "PAL");

export const airportOptions = catalog.destinations
  .filter((place) => place.airport)
  .map(({ airport, airportName, name }) => [airport, `${name} · ${airportName} (${airport})`])
  .sort((first, second) => first[1].localeCompare(second[1]));

export const originOptions = [...airportOptions, ["BAN", "Banaue"]];

export const destinationOptions = catalog.destinations
  .filter((place) => !place.parent)
  .map(({ code, name }) => [code, name])
  .sort((first, second) => first[1].localeCompare(second[1]));

export function destinationImage(value) {
  const place = findDestination(value);
  return place && photoCredits[place.slug] ? `/images/destinations/${place.slug}.webp` : null;
}

export function resolveTravelLocation(value) {
  const location = String(value || "").trim();
  return catalog.destinationLocation(location);
}

export function uniqueTravelLocations(values) {
  const seen = new Set();
  return values
    .map(resolveTravelLocation)
    .map((value) => value.trim())
    .filter((value) => {
      const normalized = value.toLowerCase();
      if (!value || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}
