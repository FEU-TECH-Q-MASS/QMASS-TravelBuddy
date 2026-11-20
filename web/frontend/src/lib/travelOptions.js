export const airportOptions = [
  ["MNL", "Manila — Ninoy Aquino International"],
  ["CEB", "Cebu — Mactan-Cebu International"],
  ["DGT", "Dumaguete — Sibulan"],
  ["PPS", "Puerto Princesa International"],
  ["USU", "Busuanga/Coron — Francisco B. Reyes"],
  ["TAC", "Tacloban — Daniel Z. Romualdez"],
  ["LAO", "Laoag International"],
];
export const destinationOptions = [
  ["MNL", "Manila, Philippines"],
  ["CEB", "Cebu, Philippines"],
  ["DGT", "Dumaguete, Philippines"],
  ["PPS", "Puerto Princesa, Philippines"],
  ["USU", "Coron, Philippines"],
  ["TAC", "Tacloban, Philippines"],
  ["LAO", "Laoag, Philippines"],
  ["PAL", "Palawan, Philippines"],
  ["BOH", "Bohol, Philippines"],
  ["BOR", "Boracay, Philippines"],
  ["BAN", "Banaue, Philippines"],
];

const locationLabels = new Map([
  ...airportOptions.map(([code, label]) => [code, `${label}, Philippines`]),
  ...destinationOptions,
]);

export function resolveTravelLocation(value) {
  const location = String(value || "").trim();
  return locationLabels.get(location.toUpperCase()) || location;
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
