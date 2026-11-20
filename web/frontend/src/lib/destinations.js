import catalog from "../../../shared/destinations.cjs";
import { destinationImage } from "./travelOptions.js";
import photoCredits from "./destinationPhotoCredits.json" with { type: "json" };

export const destinations = catalog.destinations.map((place) => ({
  ...place,
  country: "Philippines",
  image: destinationImage(place.code),
  photoCredit: photoCredits[place.slug],
  ...(place.code === "PAL" && {
    description: "Choose a base in Palawan to match your trip. Puerto Princesa, Coron, and El Nido each have their own airport and nearby highlights.",
  }),
}));

const bases = destinations.filter((place) => place.parent === "PAL");
export const topLevelDestinations = destinations
  .filter((place) => !place.parent)
  .map((place) => place.code === "PAL" ? { ...place, bases } : place);
