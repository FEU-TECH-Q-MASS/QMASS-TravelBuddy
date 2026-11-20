const { findDestination } = require("./destinations.cjs");

// Published network snapshot for route suggestions. It does not represent availability on a date.
// Sources: PAL winter timetable (Oct 29, 2026), Cebu Pacific's Cebu/Clark/Davao guides,
// Clark International Airport, Sunlight Air (Tablas and Siquijor), and AirAsia Philippines.
const networks = {
  MNL: "BCD BXU CBO CEB CGY CYZ DGT DPL DRP DVO GES ILO KLO LAO MPH OZC PAG PPS RXS TAC TAG TUG VRC ZAM",
  CRK: "BCD BSO CEB CGY DVO ENI GES IAO ILO MBT MPH PPS TAG TBH USU WNP",
  CEB: "BCD BPA BXU CBO CGM CGY CRM CYP DGT DPL DRP DVO ENI GES IAO ILO IQR LAO MBT MPH OZC PAG PPS SUG TAC USU ZAM",
  DVO: "BCD CGY IAO ILO MPH PPS TAC TAG ZAM",
  ILO: "CGY LAO PPS TAG",
  ENI: "MPH TAG USU",
  TWT: "CBO ZAM",
};

const pairKey = (first, second) => [first, second].sort().join("-");
const airRoutes = new Set(Object.entries(networks).flatMap(([hub, airports]) =>
  airports.split(" ").map((airport) => pairKey(hub, airport))
));

const ferryRoutes = new Map([
  ["CEB-TAG", "Take a ferry between Cebu City and Tagbilaran, then continue by road to your stay."],
  ["CEB-DGT", "Check ferry and road connections between Cebu and Dumaguete."],
  ["CEB-IQR", "Check ferry schedules between Cebu and Siquijor."],
  ["DGT-IQR", "Check ferry schedules between Dumaguete and Siquijor."],
  ["BCD-ILO", "Take a ferry between Bacolod and Iloilo."],
].map(([pair, note]) => [pairKey(...pair.split("-")), note]));

const roadRoutes = new Map([
  ["CRK-MNL", "Travel by road between Metro Manila and Clark. Check airport bus or private transfer options."],
  ["ENI-PPS", "Take a van, bus, or private transfer between Puerto Princesa and El Nido."],
]);

const mainlandLuzon = new Set(["MNL", "CRK", "LAO", "CYZ", "TUG", "DRP", "WNP"]);
const banaueRoadNote = "Continue to Banaue by road. From Manila, check the direct bus to Banaue.";
const boracayFromKalibo = "Travel by road from Kalibo to Caticlan Jetty Port, then take a boat to Boracay.";

function getTripTransport(originValue, destinationValue) {
  const origin = findDestination(originValue);
  const destination = findDestination(destinationValue);
  if (!origin || !destination || origin.code === "PAL" || destination.code === "PAL") return null;

  const from = origin.airport;
  const to = destination.airport;
  if (origin.code === destination.code) {
    const note = destination.code === "BOR" && originValue === "MPH"
      ? "Continue from Caticlan Airport to the jetty, then take a boat to Boracay."
      : "Plan local travel within your destination.";
    return { mode: "local", note };
  }

  if (destination.code === "BOR" && from === "KLO") {
    return { mode: "road", note: boracayFromKalibo };
  }

  const airportPair = pairKey(from, to);
  const road = roadRoutes.get(airportPair);
  if (road) return { mode: "road", note: road };

  const ferry = ferryRoutes.get(airportPair);
  if (ferry) {
    return {
      mode: "ferry",
      note: ferry,
      route: airRoutes.has(airportPair) ? [from, to] : undefined,
    };
  }

  if (destination.code === "BAN" || origin.code === "BAN") {
    const fromBanaue = origin.code === "BAN";
    const otherAirport = fromBanaue ? to : from;
    if (mainlandLuzon.has(otherAirport)) {
      const note = fromBanaue
        ? "Travel by road from Banaue. Check bus or private transfer options for your starting point and destination."
        : banaueRoadNote;
      return { mode: "road", note };
    }
    const gateway = ["MNL", "CRK", "CYZ"].find((candidate) => airRoutes.has(pairKey(otherAirport, candidate))) || "MNL";
    const route = fromBanaue ? [gateway, otherAirport] : [otherAirport, gateway];
    const note = fromBanaue ? "Travel by road from Banaue to your departure airport before flying." : banaueRoadNote;
    return { mode: "flight", route, note, direct: airRoutes.has(pairKey(...route)) };
  }

  if (!from || !to) return null;
  if ((from === "MNL" && ["ENI", "USU"].includes(to)) || (to === "MNL" && ["ENI", "USU"].includes(from))) {
    const startingInManila = from === "MNL";
    return {
      mode: "flight",
      route: startingInManila ? ["CRK", to] : [from, "CRK"],
      direct: true,
      note: [startingInManila ? "Travel by road from Manila to Clark before flying." : "Continue from Clark to Manila by road.", destination.transfer].filter(Boolean).join(" "),
    };
  }

  const direct = airRoutes.has(airportPair);
  const alternate = destination.code === "BOR" ? "KLO" : undefined;
  const note = [destination.transfer, airportPair === "LAO-MNL" && "Bus service is also available between Manila and Laoag."].filter(Boolean).join(" ");
  return { mode: "flight", route: [from, to], alternate, direct, note };
}

module.exports = { getTripTransport };
