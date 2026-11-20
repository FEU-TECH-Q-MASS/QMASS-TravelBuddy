"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import ConditionWarning from "@/components/ConditionWarning";
import { resolveTravelLocation, uniqueTravelLocations } from "@/lib/travelOptions";
import RouteMap from "@/components/RouteMap";
const tabs = ["itinerary", "flights", "hotels", "budget", "routes", "conditions"];
const money = (trip, value) => value == null ? "Price unavailable" : `${trip.currency} ${Number(value).toLocaleString()}`;
export default function TripWorkspace({ params }) {
  const [trip, setTrip] = useState(null); const [tab, setTab] = useState("itinerary"); const [error, setError] = useState(""); const [refreshing, setRefreshing] = useState(false);
  const refreshInFlight = useRef(false);
  useEffect(() => { Promise.resolve(params).then(({ id }) => api(`/trips/${id}`).then(({ trip: value }) => setTrip(value)).catch((e) => setError(e.message))); }, [params]);
  async function refreshData(kind = "all") {
    if (!trip || refreshInFlight.current) return;
    refreshInFlight.current = true;
    setRefreshing(true);
    setError("");
    try {
      const endpoint = kind === "conditions" ? "refresh-conditions" : "refresh-data";
      const { trip: value } = await api(`/trips/${trip.id}/${endpoint}`, { method: "POST" });
      setTrip((current) => current?.id === value.id ? value : current);
    } catch (e) {
      setError(e.message);
    } finally {
      refreshInFlight.current = false;
      setRefreshing(false);
    }
  }
  function selectTab(value) {
    if (value === tab) return;
    setTab(value);
    if (value === "conditions") void refreshData("conditions");
  }
  if (error && !trip) return <section className="page-width section-space"><p className="notice">{error}</p></section>; if (!trip) return <section className="page-width section-space">Loading workspace…</section>;
  return <section className="page-width section-space"><div className="rounded-3xl bg-brand-900 p-7 text-white sm:p-10"><div className="flex flex-wrap items-start justify-between gap-6"><div><p className="text-xs font-bold tracking-[0.2em] text-cyan-200 uppercase">Trip workspace</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">{trip.destination}</h1><p className="mt-4 text-sm text-white/75">{trip.origin} → {trip.destination} · {trip.departure} to {trip.returnDate}</p></div><span className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold">{trip.generation?.provider === "google-gemini" ? "AI itinerary" : "Planning preview"}</span></div><div className="mt-8 grid gap-3 sm:grid-cols-3"><Summary label="Travelers" value={trip.travelers} detail="in your group" /><Summary label="Budget" value={money(trip, trip.budget)} detail="whole trip" /><Summary label="Estimate" value={money(trip, trip.budgetBreakdown.estimatedTotal)} detail={trip.budgetBreakdown.remaining < 0 ? "over budget" : "within budget"} /></div></div><div className="mt-8 flex flex-wrap items-center justify-between gap-4"><div className="flex flex-wrap gap-2">{tabs.map((value) => <button key={value} onClick={() => selectTab(value)} className="filter-pill" aria-pressed={tab === value}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div><div className="flex gap-2"><button className="btn btn-outline" onClick={() => refreshData()} disabled={refreshing}>{refreshing ? "Refreshing…" : "Refresh travel data"}</button></div></div>{error && <p className="notice mt-5">{error}</p>}<div className="mt-8">{tab === "itinerary" && <Itinerary trip={trip} />}{tab === "flights" && <OfferList title="Flight options" items={trip.offers.flights} render={(item) => <><h3 className="text-lg font-semibold">{item.route}</h3><p className="mt-2 text-sm text-slate-500">{item.airline} · {item.availability}</p><div className="mt-4 flex justify-between"><strong>{money(trip, item.fare)}</strong><span className="text-sm text-slate-500">{item.baggage}</span></div></>} />}{tab === "hotels" && <OfferList title="Hotel options" items={trip.offers.hotels} render={(item) => <><h3 className="text-lg font-semibold">{item.name}</h3><p className="mt-2 text-sm text-slate-500">{item.location} · capacity {item.guests} · {item.availability}</p><div className="mt-4 flex justify-between"><strong>{money(trip, item.totalStay)} total</strong><span className="text-sm text-slate-500">{money(trip, item.nightlyRate)} per night</span></div></>} />}{tab === "budget" && <Budget trip={trip} />}{tab === "routes" && <Routes trip={trip} />}{tab === "conditions" && <div aria-busy={refreshing}>{refreshing && <p role="status" className="notice mb-5">Updating weather and travel conditions…</p>}<Conditions trip={trip} /></div>}</div></section>;
}
function Summary({ label, value, detail }) { return <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-white/60">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p><p className="mt-1 text-xs text-white/60">{detail}</p></div>; }

//Iteninerary block - had to do a quick refactor, it was hurting my head.
function Itinerary({ trip }) {
  const [selectedDay, setSelectedDay] = useState(
    trip.itinerary[0]?.day || 1
  );

  const day =
    trip.itinerary.find((item) => item.day === selectedDay) ||
    trip.itinerary[0];

  return (
    <div>
      {/* DAY SELECTION */}
      <div className="mb-7">
        <p className="eyebrow">Your daily plan</p>

        <h2 className="text-3xl font-semibold text-brand-900">
          A trip with room to breathe.
        </h2>

        <div className="mt-5 flex gap-2 overflow-x-auto border-b border-slate-200 pb-3">
          {trip.itinerary.map((item) => (
            <button
              key={item.day}
              onClick={() => setSelectedDay(item.day)}
              className={`shrink-0 rounded-xl px-4 py-3 text-left ${
                item.day === selectedDay
                  ? "bg-brand-900 text-white"
                  : "bg-slate-50 text-slate-600"
              }`}
            >
              <span className="block text-xs font-bold">
                DAY {item.day}
              </span>

              <span className="mt-1 block text-xs">
                {new Date(
                  `${item.date}T00:00:00`
                ).toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* DAILY ITINERARY */}
      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b bg-slate-50 px-6 py-5">
          <div>
            <p className="text-xs font-bold tracking-wider text-brand-700 uppercase">
              Day {day.day}
            </p>

            <h3 className="mt-1 text-xl font-semibold text-brand-900">
              {new Date(
                `${day.date}T00:00:00`
              ).toLocaleDateString("en-PH", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h3>
          </div>

          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            {day.activities.length} stops
          </span>
        </div>

        {/* ACTIVITIES */}
        <div className="p-6">
          {day.activities.map((activity, index) => (
            <div
              key={activity.id}
              className="relative flex gap-4 pb-7 last:pb-0"
            >
              {/* ACTIVITY NUMBER */}
              <div className="flex w-10 shrink-0 flex-col items-center">
                <span className="z-10 flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
                  {index + 1}
                </span>

                {index < day.activities.length - 1 && (
                  <span className="absolute top-9 bottom-0 w-px bg-cyan-100" />
                )}
              </div>

              {/* ACTIVITY CARD */}
              <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-brand-700">
                      {activity.time}
                    </p>

                    <h4 className="mt-1 text-base font-semibold text-brand-900">
                      {activity.title}
                    </h4>
                  </div>

                  <strong className="text-sm text-brand-700">
                    {money(trip, activity.cost)}
                  </strong>
                </div>

                {/* ACTIVITY DETAILS */}
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>
                    {activity.durationMinutes} minutes
                  </span>

                  {activity.travelMinutesFromPrevious > 0 && (
                    <span>
                      Next stop:{" "}
                      {activity.travelMinutesFromPrevious} min ·{" "}
                      {Number(
                        activity.distanceKmFromPrevious
                      ).toFixed(1)}{" "}
                      km
                    </span>
                  )}
                </div>

                {/* MODULE 6: WEATHER WARNINGS */}
                {(trip.conditions?.warnings || [])
                  .filter(
                    (warning) =>
                      warning.activityId === activity.id &&
                      warning.date === day.date
                  )
                  .map((warning, warningIndex) => (
                    <ConditionWarning
                      key={`${warning.code}-${activity.id}-${warningIndex}`}
                      warning={warning}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

function OfferList({ title, items, render }) { return <div><p className="eyebrow">Travel options</p><h2 className="text-3xl font-semibold text-brand-900">{title}</h2>{items.length ? <div className="mt-6 grid gap-4">{items.map((item) => <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-6">{render(item)}{item.googleMapsUri && <a href={item.googleMapsUri} target="_blank" rel="noreferrer" className="mt-5 inline-block text-sm font-semibold text-brand-700 underline">View on Google Maps ↗</a>}</article>)}</div> : <div className="notice mt-6">No live {title.toLowerCase()} are available yet. Configure a live provider and select “Refresh travel data” to retrieve current results.</div>}</div>; }
function Budget({ trip }) { const entries = Object.entries(trip.budgetBreakdown).filter(([key]) => !["currency", "remaining", "estimatedTotal"].includes(key)); const remaining = Number(trip.budgetBreakdown.remaining || 0); const overBudget = remaining < 0; return <div><p className="eyebrow">Budget overview</p><h2 className="text-3xl font-semibold text-brand-900">Where your budget goes.</h2><div className="mt-6 grid gap-4 sm:grid-cols-2">{entries.map(([key, value]) => <div key={key} className="rounded-2xl border border-slate-200 p-5"><p className="text-sm capitalize text-slate-500">{key.replace(/([A-Z])/g, " $1")}</p><p className="mt-2 text-2xl font-semibold text-brand-900">{money(trip, value)}</p></div>)}</div><div className={`mt-5 rounded-2xl p-5 ${overBudget ? "border border-red-200 bg-red-50 text-red-900" : "bg-brand-50 text-brand-900"}`}><p className="text-sm font-semibold">{overBudget ? "Can't afford this plan" : "Estimated budget remaining"}</p><p className="mt-1 text-2xl font-semibold">{overBudget ? `${money(trip, Math.abs(remaining))} over budget` : money(trip, remaining)}</p><p className="mt-2 text-sm">{overBudget ? "Increase your budget or reduce activities, flights, or accommodation." : "This estimate stays within your planned budget."}</p></div></div>; }
function Routes({ trip }) { const [selectedDay, setSelectedDay] = useState(trip.routes[0]?.day || 1); const route = trip.routes.find((item) => item.day === selectedDay) || trip.routes[0]; const day = trip.itinerary.find((item) => item.day === selectedDay); const places = day?.activities.map((activity) => activity.location || activity.title) || []; const destinations = uniqueTravelLocations(places.length ? places : route.stops.map((stop) => stop.location || stop.title)); const origin = destinations[0] || resolveTravelLocation(trip.destination); const destination = destinations.at(-1) || resolveTravelLocation(trip.destination); const waypoints = destinations.slice(1, -1).join("|"); const mapsUrl = destinations.length === 1 ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}` : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ""}`; return <div><p className="eyebrow">Maps and transportation</p><h2 className="text-3xl font-semibold text-brand-900">Follow your local route in Google Maps.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Select a day to view locations from that day’s itinerary. Airport transfers are not shown as local driving routes.</p><div className="mt-6 flex gap-2 overflow-x-auto border-b border-slate-200 pb-3">{trip.routes.map((item) => <button key={item.day} onClick={() => setSelectedDay(item.day)} className={`shrink-0 rounded-xl px-4 py-3 text-left ${item.day === selectedDay ? "bg-brand-900 text-white" : "bg-slate-50 text-slate-600"}`}><span className="block text-xs font-bold">DAY {item.day}</span><span className="mt-1 block text-xs">{item.totalDistanceKm.toFixed(1)} km estimated</span></button>)}</div><div className="mt-6"><RouteMap route={route} places={places} origin={destinations.length > 1 ? origin : undefined} destination={destinations.length > 1 ? destination : undefined} /></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5"><div><p className="font-semibold text-brand-900">Day {route.day}</p><p className="mt-1 text-sm text-slate-500">{route.totalDistanceKm.toFixed(1)} km · {route.estimatedTravelMinutes} minutes estimated travel</p></div><a href={mapsUrl} target="_blank" rel="noreferrer" className="btn btn-primary">Open in Google Maps ↗</a></div></div>; }
function weatherDetails(value) {
  if (typeof value === "string") return { status: "Planning note", text: value };
  if (!value?.days?.length) return { status: "Not available", text: "Forecast coverage is not available for these travel dates yet." };
  const days = value.days;
  const average = Math.round(days.reduce((sum, item) => sum + Number(item.temperatureC || 0), 0) / days.length);
  const rain = Math.round(Math.max(...days.map((item) => Number(item.rainProbability || 0))) * 100);
  return { status: `${days.length} forecast ${days.length === 1 ? "period" : "periods"}`, text: `Around ${average}°C on average, with rain chances up to ${rain}%. Pack light layers and a compact rain jacket.` };
}

function WeatherVisual({ value }) {
  if (!value?.days?.length) return null;
  const forecast = value.days.reduce((result, item) => {
    const current = result.find((entry) => entry.date === item.date);
    if (current) {
      current.temperatures.push(Number(item.temperatureC || 0));
      current.rain = Math.max(current.rain, Number(item.rainProbability || 0));
    } else {
      result.push({ date: item.date, temperatures: [Number(item.temperatureC || 0)], rain: Number(item.rainProbability || 0) });
    }
    return result;
  }, []).slice(0, 5);
  return <div className="mt-5 flex items-end gap-2 border-b border-slate-100 pb-4" aria-label="Daily temperature and rain forecast">{forecast.map((day) => { const temperature = Math.round(day.temperatures.reduce((sum, item) => sum + item, 0) / day.temperatures.length); const rain = Math.round(day.rain * 100); return <div key={day.date} className="flex flex-1 flex-col items-center gap-1"><span className="text-[10px] font-semibold text-slate-500">{new Date(`${day.date}T00:00:00`).toLocaleDateString("en", { weekday: "short" })}</span><span className="text-sm font-semibold text-brand-900">{temperature}°</span><div className="flex h-12 w-full items-end justify-center"><span className="w-3 rounded-t-full bg-cyan-400" style={{ height: `${Math.max(15, Math.min(100, rain))}%` }} title={`${rain}% chance of rain`} /></div><span className="text-[10px] text-slate-400">{rain}% rain</span></div>; })}</div>;
}

function holidayDetails(value) {
  if (typeof value === "string") return { status: "Planning note", text: value };
  if (!value?.items?.length) return { status: "No holidays listed", text: "No public holidays were found during your selected dates." };
  const names = value.items.slice(0, 2).map((item) => `${item.name || item.localName || "Public holiday"} (${item.date})`).join(" · ");
  return { status: `${value.items.length} holiday${value.items.length === 1 ? "" : "s"}`, text: `${names}. Expect possible changes to opening hours and transport demand.` };
}

function seasonalDetails(value) {
  if (typeof value === "string") return { status: "General guidance", text: value };
  if (value?.items?.length) return { status: "Travel guidance", text: value.items.map((item) => item.message || item.title || item).join(" · ") };
  return { status: "General guidance", text: "Plan outdoor activities early, keep flexible time for weather, and confirm local opening hours before you go." };
}

function Conditions({ trip }) {
  const conditions = trip.conditions || {};
  const timestamp = conditions.sourceTimestamp || conditions.generatedAt;
  const cards = [["Weather", weatherDetails(conditions.weather), "☁"], ["Holidays", holidayDetails(conditions.holidays), "▣"], ["Seasonal context", seasonalDetails(conditions.seasonalContext || conditions.seasonalInsights), "◌"]];
  return <div><p className="eyebrow">Travel insights</p><h2 className="text-3xl font-semibold text-brand-900">Know before you go.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">A quick practical briefing for {trip.destination}, based on your selected dates.</p><div className="mt-6 grid gap-4 md:grid-cols-3">{cards.map(([title, details, icon]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wide text-brand-700">{title}</p><span className="text-xl text-brand-700" aria-hidden="true">{icon}</span></div>{title === "Weather" && <WeatherVisual value={conditions.weather} />}<p className="mt-4 text-sm font-semibold text-brand-900">{details.status}</p><p className="mt-2 text-sm leading-6 text-slate-600">{details.text}</p></article>)}</div>{timestamp && <p className="mt-5 text-xs text-slate-400">Updated {new Date(timestamp).toLocaleString()}</p>}</div>;
}
