import { getTripTransport } from "@/lib/travelOptions";

function flightSearch(origin, destination, departure, returnDate) {
  const dates = departure ? ` departing ${departure}${returnDate ? ` returning ${returnDate}` : ""}` : "";
  const query = new URLSearchParams({ q: `Flights from ${origin} to ${destination}${dates}` });
  return `https://www.google.com/search?${query}`;
}

export default function TripTransport({ origin, destination, departure, returnDate, showSearch = false }) {
  const transport = getTripTransport(origin, destination);
  if (!transport) return showSearch ? <p className="notice">Choose a starting point and destination from the catalog to see transport guidance.</p> : null;

  const [from, to] = transport.route || [];
  const heading = {
    local: "Local travel",
    road: "Road transfer",
    ferry: "Ferry option",
    flight: transport.direct ? `Flight route to check · ${from} → ${to}` : `Search for flights · ${from} → ${to}`,
  }[transport.mode];

  return (
    <div className="notice">
      <p className="font-semibold">{heading}</p>
      {transport.note && <p className="mt-1">{transport.note}</p>}
      {transport.mode === "flight" && (
        <p className="mt-1">{transport.direct
          ? "Check carriers for schedules and fares on your travel dates."
          : "Search your dates for available flights, including connections."}</p>
      )}
      {showSearch && from && to && (
        <div className="mt-4 flex flex-wrap gap-3">
          <a className="btn btn-outline" href={flightSearch(from, to, departure, returnDate)} target="_blank" rel="noreferrer">{transport.mode === "ferry" ? "Check flights as an alternative ↗" : "Check flights for your dates ↗"}</a>
          {transport.alternate && from !== transport.alternate && (
            <a className="btn btn-outline" href={flightSearch(from, transport.alternate, departure, returnDate)} target="_blank" rel="noreferrer">Check Kalibo flights ↗</a>
          )}
        </div>
      )}
    </div>
  );
}
