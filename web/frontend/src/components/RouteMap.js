"use client";

export default function RouteMap({ route, places, origin, destination }) {
  const locations = places?.length ? places : route?.stops?.map((item) => item.location || item.title) || [];
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!locations.length || !key) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Google Maps is not configured for the frontend. Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to <code>web/frontend/.env</code> to display the live route.</div>;
  const start = origin || locations[0];
  const end = destination || locations.at(-1);
  const waypoints = locations.slice(0, -1).join("|");
  const query = new URLSearchParams({ key, origin: start, destination: end, mode: "driving" });
  if (waypoints) query.set("waypoints", waypoints);
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-label={`Google Maps route for day ${route.day}`}><div className="flex items-center justify-between border-b border-slate-200 px-5 py-3"><p className="text-sm font-semibold text-brand-900">Day {route.day} route</p><p className="text-xs text-slate-500">Google Maps directions</p></div><iframe title={`Google Maps route for day ${route.day}`} src={`https://www.google.com/maps/embed/v1/directions?${query.toString()}`} className="h-105 w-full border-0" loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" /></div>;
}
