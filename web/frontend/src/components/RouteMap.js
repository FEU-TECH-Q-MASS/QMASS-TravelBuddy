"use client";

export default function RouteMap({ locations }) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  if (!locations.length) {
    return <p className="notice">There are no mapped stops for this day yet.</p>;
  }

  const singleStop = locations.length === 1;
  const title = singleStop ? "Destination map" : "Local route";
  const mapsQuery = new URLSearchParams({ api: "1" });
  const embedQuery = new URLSearchParams();
  if (key) embedQuery.set("key", key);

  if (singleStop) {
    mapsQuery.set("query", locations[0]);
    embedQuery.set("q", locations[0]);
  } else {
    const endpoints = { origin: locations[0], destination: locations.at(-1) };
    for (const [name, value] of Object.entries(endpoints)) {
      mapsQuery.set(name, value);
      embedQuery.set(name, value);
    }
    mapsQuery.set("travelmode", "driving");
    embedQuery.set("mode", "driving");
    const waypoints = locations.slice(1, -1).join("|");
    if (waypoints) {
      mapsQuery.set("waypoints", waypoints);
      embedQuery.set("waypoints", waypoints);
    }
  }

  const mapsUrl = `https://www.google.com/maps/${singleStop ? "search" : "dir"}/?${mapsQuery}`;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
        <p className="text-sm font-semibold text-brand-900">{key ? title : "Itinerary stops"}</p>
        <a href={mapsUrl} target="_blank" rel="noreferrer" className={key ? "text-sm font-semibold text-brand-700 hover:underline" : "btn btn-primary"}>
          Open in Google Maps ↗
        </a>
      </div>
      {key ? (
        <iframe title={singleStop ? `Map of ${locations[0]}` : "Local Google Maps route"}
          src={`https://www.google.com/maps/embed/v1/${singleStop ? "place" : "directions"}?${embedQuery}`}
          className="h-105 w-full border-0" loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      ) : (
        <ol className="list-decimal space-y-2 py-4 pr-5 pl-10 text-sm text-slate-700">
          {locations.map((location) => <li key={location}>{location}</li>)}
        </ol>
      )}
    </section>
  );
}
