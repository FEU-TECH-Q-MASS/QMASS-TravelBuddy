"use client";

import { uniqueTravelLocations } from "@/lib/travelOptions";

export default function RouteMap({ route, places, origin, destination }) {
  const locations = uniqueTravelLocations(
    places?.length ? places : route?.stops?.map((item) => item.location || item.title) || [],
  );
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key || !locations.length) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Google Maps is not configured for the frontend. Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to display the local route.
      </div>
    );
  }

  if (locations.length === 1) {
    const placeQuery = new URLSearchParams({ key, q: locations[0] });
    const searchQuery = new URLSearchParams({ api: "1", query: locations[0] });
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-label="Destination map">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <p className="text-sm font-semibold text-brand-900">Destination map</p>
          <a href={`https://www.google.com/maps/search/?${searchQuery.toString()}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-700 hover:underline">Open in Google Maps ↗</a>
        </div>
        <iframe title={`Map of ${locations[0]}`} src={`https://www.google.com/maps/embed/v1/place?${placeQuery.toString()}`} className="h-105 w-full border-0" loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      </div>
    );
  }

  const start = origin || locations[0];
  const end = destination || locations.at(-1);
  const sameLocation = (left, right) => left.trim().toLowerCase() === right.trim().toLowerCase();
  const waypoints = locations.filter((location) => !sameLocation(location, start) && !sameLocation(location, end)).join("|");
  const query = new URLSearchParams({ key, origin: start, destination: end, mode: "driving" });
  const directionsQuery = new URLSearchParams({ api: "1", origin: start, destination: end, travelmode: "driving" });
  if (waypoints) {
    query.set("waypoints", waypoints);
    directionsQuery.set("waypoints", waypoints);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-label="Local Google Maps route">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
        <p className="text-sm font-semibold text-brand-900">Local route</p>
        <a href={`https://www.google.com/maps/dir/?${directionsQuery.toString()}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-700 hover:underline">Open in Google Maps ↗</a>
      </div>
      <iframe title="Local Google Maps route" src={`https://www.google.com/maps/embed/v1/directions?${query.toString()}`} className="h-105 w-full border-0" loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
    </div>
  );
}
