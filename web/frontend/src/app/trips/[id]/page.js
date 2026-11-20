"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { api, generateSavedItinerary } from "@/lib/api";
import ConditionWarning from "@/components/ConditionWarning";
import { destinationImage, resolveTravelLocation, orderedRouteLocations } from "@/lib/travelOptions";
import TripTransport from "@/components/TripTransport";
import FlightOffersPanel from "@/components/FlightOffersPanel";
import RouteMap from "@/components/RouteMap";
import Icon from "@/components/Icon";
import TripEditForm from "@/components/TripEditForm";
const tabs = ["itinerary", "transport", "hotels", "budget", "routes", "conditions"];
const money = (trip, value) => value == null ? "Price unavailable" : `${trip.currency} ${Number(value).toLocaleString()}`;
const tripDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const sourceDateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  timeZone: "Asia/Manila", timeZoneName: "short",
});



function SourceTime({ value, label }) {
  const date = new Date(value);
  if (!value || !Number.isFinite(date.getTime())) return null;
  return <span>{label} <time dateTime={value}>{sourceDateFormatter.format(date)}</time></span>;
}

function formatTripDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : tripDateFormatter.format(date);
}

function itineraryUpdateMessage(update, busy, error) {
  if (busy === "schedule") return "Planning your itinerary…";
  if (busy === "budget") return "Looking for activities that fit your group budget…";
  if (error) return error;
  if (update?.status === "pending") return "Generate an itinerary for your trip.";
  if (update?.status === "fixed-costs") return "Airfare, lodging, meals, and transport already exceed your budget. Edit your trip costs or budget before replanning.";
  if (update?.status === "unfit") return "Gemini did not find a plan within your estimated budget. Your existing itinerary is still saved.";
  if (update?.status === "failed" || update?.status === "venues-unavailable") return update.reason === "schedule"
    ? "We couldn’t generate an AI itinerary. Your existing plan is still saved."
    : "AI replanning was unavailable. Your existing itinerary is still saved.";
  return "";
}

export default function TripWorkspace({ params }) {
  const [flightTestLoading, setFlightTestLoading] = useState(false);
  const [flightTestResult, setFlightTestResult] = useState(null);
  const [flightTestError, setFlightTestError] = useState("");
  const [trip, setTrip] = useState(null); const [tab, setTab] = useState("itinerary"); const [error, setError] = useState(""); const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState("");
  const [generationReason, setGenerationReason] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [flightPriceResult, setFlightPriceResult] = useState(null);
  const [flightPriceLoading, setFlightPriceLoading] = useState(false);
  const [flightPriceError, setFlightPriceError] = useState("");
  const refreshInFlight = useRef(false);
  const generationInFlight = useRef(false);
  const editButton = useRef(null);
  const editPanel = useRef(null);
  const itineraryNotice = useRef(null);
  useEffect(() => { Promise.resolve(params).then(({ id }) => api(`/trips/${id}`).then(({ trip: value }) => setTrip(value)).catch((e) => setError(e.message))); }, [params]);
  useEffect(() => {
    if (editing) editPanel.current?.focus();
  }, [editing]);

  function openEditor() {
    if (refreshInFlight.current || generationInFlight.current) return;
    setError("");
    setSaved("");
    setGenerationError("");
    setEditing(true);
  }

  function closeEditor() {
    setEditing(false);
    requestAnimationFrame(() => {
      if (editButton.current?.disabled) itineraryNotice.current?.focus();
      else editButton.current?.focus();
    });
  }


  async function testDuffelSeatMaps() {
    const offerId = flightTestResult?.offers?.[0]?.id;

    if (!trip?.id || !offerId) {
      alert("Search for flight offers first.");
      return;
    }

    try {
      console.log("Fetching seat maps for:", offerId);

      const result = await api(
        `/trips/${trip.id}/flight-offers/${offerId}/seat-maps`
      );

      console.log("Duffel Seat Maps:", result);

      alert(
        result.seatMapsAvailable
          ? `Seat maps found: ${result.seatMaps.length}`
          : "No seat maps available for this flight."
      );
    } catch (error) {
      console.error("Seat map test failed:", error);
      alert(`Seat map error: ${error.message}`);
    }
  }

  async function testDuffelPrice() {
    console.log("[DUFFEL] Verify Flight Price clicked");
    const offerId = flightTestResult?.offers?.[0]?.id;

    setFlightPriceError("");
    setFlightPriceResult(null);

    if (!trip?.id) {
      setFlightPriceError("Trip is not loaded yet.");
      return;
    }
    if (!offerId) {
      setFlightPriceError("No flight offer available. Click Test Duffel Flight Search first.");
      return;
    }
    if (flightPriceLoading) return;

    setFlightPriceLoading(true);
    try {
      console.log("[DUFFEL] Verifying offer:", offerId);
      const result = await api(
        `/trips/${trip.id}/flight-offers/${encodeURIComponent(offerId)}/verify`,
        { method: "POST" }
      );
      console.log("[DUFFEL] Verification response:", result);
      setFlightPriceResult(result);
    } catch (error) {
      console.error("[DUFFEL] Verification failed:", error);
      setFlightPriceError(error?.message || "Flight verification failed.");
    } finally {
      setFlightPriceLoading(false);
    }
  }



  async function updateItinerary(savedTrip, reason) {
    if (generationInFlight.current || refreshInFlight.current) return;
    generationInFlight.current = true;
    setGenerationReason(reason);
    setGenerationError("");
    setSaved("");
    try {
      const { trip: updated } = await generateSavedItinerary(savedTrip, reason);
      setTrip((current) => current?.id === updated.id ? updated : current);
      if (!updated.itineraryUpdate) setSaved("AI itinerary updated.");
    } catch (e) {
      setGenerationError(e.message);
    } finally {
      generationInFlight.current = false;
      setGenerationReason("");
    }
  }

  async function refreshData(kind = "all") {
    if (!trip || editing || refreshInFlight.current || generationInFlight.current) return;
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
  const destinationLabel = resolveTravelLocation(trip.destination).replace(/, Philippines$/i, "");
  const originLabel = resolveTravelLocation(trip.origin).replace(/, Philippines$/i, "");
  const overviewImage = destinationImage(trip.destination) || "/images/philippines.jpg";
  const { estimatedTotal, remaining } = trip.budgetBreakdown;
  const update = trip.itineraryUpdate;
  const generationStatus = itineraryUpdateMessage(update, generationReason, generationError);
  const hasCategoryItinerary = trip.generation?.provider === "google-gemini" &&
    trip.itinerary.some(({ activities }) => activities.some(({ venueKind }) => venueKind));
  const canGenerateSchedule = update?.reason === "schedule" || hasCategoryItinerary;
  const canReplanBudget = remaining < 0 && update?.reason !== "schedule" && update?.status !== "fixed-costs";
  const scheduleKey = `${trip.id}:${trip.destination}:${trip.departure}:${trip.returnDate}`;


async function testDuffelFlights() {
  if (!trip?.id || flightTestLoading) return;

  setFlightTestLoading(true);
  setFlightTestError("");
  setFlightTestResult(null);
  setFlightPriceResult(null);
  setFlightPriceError("");

  try {
    console.log("Testing Duffel flight search...");
    console.log("Trip ID:", trip.id);

    const result = await api(
      `/trips/${trip.id}/flight-offers`
    );

    console.log("Duffel flight search result:", result);

    setFlightTestResult(result);
  } catch (error) {
    console.error("Duffel flight search failed:", error);
    setFlightTestError(error.message);
  } finally {
    setFlightTestLoading(false);
  }
}

  return (
    <section className="page-width section-space">
      <div className="relative isolate overflow-hidden rounded-3xl bg-brand-900 p-7 text-white sm:p-10">
        <Image src={overviewImage} alt="" fill unoptimized fetchPriority="high" className="object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-brand-900/95 via-brand-900/55 to-brand-900/50 sm:bg-linear-to-r sm:from-brand-900/90 sm:via-brand-900/55 sm:to-brand-900/25" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-cyan-200 uppercase">Trip workspace</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">{destinationLabel}</h1>
            <p className="mt-4 text-sm text-white/75">
              {originLabel} → {destinationLabel} · <time dateTime={trip.departure}>{formatTripDate(trip.departure)}</time>
              {" to "}<time dateTime={trip.returnDate}>{formatTripDate(trip.returnDate)}</time>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button ref={editButton} type="button" className="btn bg-white text-brand-900 hover:bg-brand-50 disabled:opacity-70"
              onClick={openEditor} disabled={refreshing || editing || Boolean(generationReason)} aria-expanded={editing} aria-controls="workspace-trip-editor">
              <Icon name="edit" size={16} /> Edit trip
            </button>
          </div>
        </div>
        <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
          <Summary label="Travelers" value={trip.travelers} detail="in your group" />
          <Summary label="Budget" value={money(trip, trip.budget)} detail="whole trip" />
          <Summary label="Group estimate" value={money(trip, estimatedTotal)} detail={remaining < 0 ? `${money(trip, Math.abs(remaining))} over budget` : "estimated within budget"} />
        </div>
      </div>
      <div id="workspace-trip-editor" ref={editPanel} tabIndex={-1} hidden={!editing}
        className="mt-6 scroll-mt-28 rounded-2xl border border-slate-200 bg-white px-5 pb-5 sm:px-6 sm:pb-6">
        {editing && <TripEditForm key={trip.id} trip={trip} onCancel={closeEditor} onSave={(updated, shouldGenerate) => {
          setTrip(updated);
          setSaved("Trip updated.");
          closeEditor();
          if (shouldGenerate) void updateItinerary(updated, "schedule");
        }} />}
      </div>
      {(generationStatus || saved || canGenerateSchedule || canReplanBudget) && (
        <div className="notice mt-5 flex flex-wrap items-center justify-between gap-3">
          <p ref={itineraryNotice} tabIndex={-1} role="status">{generationStatus || saved || (hasCategoryItinerary
            ? "Generate a new itinerary for more specific activities and locations." : "Looking for a lower-cost itinerary?")}</p>
          {(canGenerateSchedule || canReplanBudget) && (
            <div className="flex flex-wrap gap-2">
              {canGenerateSchedule && <button type="button" className="btn btn-outline" disabled={editing || refreshing || Boolean(generationReason)}
                onClick={() => void updateItinerary(trip, "schedule")}>
                {generationError || (update?.reason === "schedule" && update.status !== "pending") ? "Retry AI generation" : "Generate AI itinerary"}
              </button>}
              {canReplanBudget && <button type="button" className="btn btn-outline" disabled={editing || refreshing || Boolean(generationReason)}
                onClick={() => void updateItinerary(trip, "budget")}>
                Replan to fit budget
              </button>}
            </div>
          )}
        </div>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((value) => <button key={value} onClick={() => selectTab(value)} className="filter-pill capitalize" aria-pressed={tab === value}>{value}</button>)}
        </div>
        <button type="button" className="btn btn-outline" onClick={() => refreshData()} disabled={refreshing || editing || Boolean(generationReason)}>{refreshing ? "Refreshing…" : "Refresh travel data"}</button>
      </div>
      {error && <p className="notice mt-5">{error}</p>}
      <div className="mt-8">
        {tab === "itinerary" && <Itinerary key={scheduleKey} trip={trip} />}
        {tab === "transport" && (
          <div>
            <h2 className="text-3xl font-semibold text-brand-900">Getting there</h2>
            <div className="mt-6">

<FlightOffersPanel trip={trip} />

              {trip.destination === "PAL"
                ? <p className="notice">Choose Puerto Princesa, Coron, or El Nido when you edit this saved trip to see transport options.</p>
                
                : <TripTransport origin={trip.origin} destination={trip.destination} departure={trip.departure} returnDate={trip.returnDate} showSearch />}
            </div>
          </div>
        )}
        {tab === "hotels" && <Hotels trip={trip} />}
        {tab === "budget" && <Budget trip={trip} />}
        {tab === "routes" && <Routes key={scheduleKey} trip={trip} />}
        {tab === "conditions" && <div aria-busy={refreshing}>{refreshing && <p role="status" className="notice mb-5">Updating weather and travel conditions…</p>}<Conditions trip={trip} /></div>}
      </div>
    </section>
  );
}
function Summary({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-brand-900/65 p-4 backdrop-blur-sm">
      <p className="text-xs text-white/80">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-white/80">{detail}</p>
    </div>
  );
}

function Itinerary({ trip }) {
  const [selectedDay, setSelectedDay] = useState(
    trip.itinerary[0]?.day || 1
  );

  const day =
    trip.itinerary.find((item) => item.day === selectedDay) ||
    trip.itinerary[0];
  const destination = resolveTravelLocation(trip.destination);

  return (
    <div>
      {/* DAY SELECTION */}
      <div className="mb-7">
        <p className="eyebrow">Your daily plan</p>

        <h2 className="text-3xl font-semibold text-brand-900">
          A trip with room to breathe.
        </h2>
        {trip.generation?.provider === "google-gemini" && <p className="mt-2 text-sm text-slate-600">
          Check suggested locations, opening hours, and fees before visiting.
        </p>}

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
          {day.activities.map((activity, index) => {
            const savedPlaceQuery = activity.placeId && new URLSearchParams({
              api: "1", query: destination, query_place_id: activity.placeId,
            });
            const meal = ["breakfast", "lunch", "dinner"].includes(activity.venueKind);
            return (
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

                  {meal ? <span className="text-sm text-brand-700">Included in meal allowance</span>
                    : activity.venueKind !== "free_time" && <strong className="text-sm text-brand-700">{money(trip, activity.cost)} per traveler</strong>}
                </div>

                {/* ACTIVITY DETAILS */}
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>
                    {activity.durationMinutes} minutes
                  </span>

                  {activity.location && <span>{resolveTravelLocation(activity.location)}</span>}
                </div>
                {activity.suggestedPlace && <p className="mt-3 text-sm text-slate-600">
                  Gemini suggestion: <strong>{activity.suggestedPlace}</strong>. Check the location and opening hours before visiting.
                </p>}
                {savedPlaceQuery && <a href={`https://www.google.com/maps/search/?${savedPlaceQuery}`}
                  target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-brand-900 underline">Open saved stop in Google Maps</a>}
                {activity.venueSource && <div className="mt-3 text-xs text-slate-600">
                  <p>{activity.venueNote}</p>
                  <a href={activity.venueSource} target="_blank" rel="noreferrer" className="underline">Municipal tourism listing</a>
                </div>}

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
            );
          })}
        </div>
      </article>
    </div>
  );
}

function Hotels({ trip }) {
  const { hotels = [] } = trip.offers || {};
  const basis = trip.estimateBasis;
  return (
    <div>
      <h2 className="text-3xl font-semibold text-brand-900">Hotel estimates</h2>
      {basis?.nights === 0 ? <p className="notice mt-6">This trip has no overnight stay.</p> : hotels.length ? (
        <div className="mt-6 grid gap-4">
          {hotels.map((hotel) => (
            <article key={hotel.id} className="rounded-3xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold">{hotel.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{hotel.location}</p>
              <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-sm text-slate-600">
                <span>{hotel.source || (hotel.id?.startsWith("ai-hotel-") ? "Gemini estimate" : "TravelBuddy sample")}</span>
                <SourceTime value={hotel.quotedAt} label="Prepared" />
              </p>
              <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
                <strong>{money(trip, hotel.totalStay)} group stay</strong>
                <span className="text-sm text-slate-600">{money(trip, hotel.nightlyRate)} per room per night</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{hotel.rooms} {hotel.rooms === 1 ? "room" : "rooms"} · {hotel.nights} {hotel.nights === 1 ? "night" : "nights"}</p>
              <p className="mt-1 text-xs text-slate-600">Confirm availability, taxes, and fees with the hotel.</p>
              {hotel.id === basis?.hotelId && <p className="mt-2 text-sm font-medium text-brand-700">Used in your budget estimate</p>}
            </article>
          ))}
        </div>
      ) : <p className="notice mt-6">Hotel estimates are unavailable. Your budget uses a room allowance.</p>}
    </div>
  );
}

function Budget({ trip }) {
  const { rooms, nights, vehicles, guestsPerRoom, guestsPerVehicle } = trip.estimateBasis || {};
  const { flights, accommodation, activities, meals, transportation, remaining } = trip.budgetBreakdown;
  const entries = [
    ["Airfare", flights, trip.includeFlights ? "Estimated per traveler" : "Excluded from estimate"],
    ["Accommodation", accommodation, nights ? `${rooms} ${rooms === 1 ? "room" : "rooms"} for ${nights} ${nights === 1 ? "night" : "nights"} · up to ${guestsPerRoom} guests per room` : "No overnight stays"],
    ["Activities", activities, "Estimated per traveler"],
    ["Meals", meals, "Daily allowance per traveler"],
    ["Local transport", transportation, `${vehicles} ${vehicles === 1 ? "vehicle" : "vehicles"} · up to ${guestsPerVehicle} travelers each`],
  ];
  const overBudget = remaining < 0;
  return (
    <div>
      <h2 className="text-3xl font-semibold text-brand-900">Group budget</h2>
      <p className="mt-2 text-sm text-slate-600">Planning estimates for the whole group. Confirm current prices, taxes, and fees before booking.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {entries.map(([label, value, description]) => (
          <div key={label} className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-600">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-brand-900">{money(trip, value)}</p>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
        ))}
      </div>
      <div className={`mt-5 rounded-2xl p-5 ${overBudget ? "border border-red-200 bg-red-50 text-red-900" : "bg-brand-50 text-brand-900"}`}>
        <p className="text-sm font-semibold">{overBudget ? "Estimated over budget" : "Estimated budget remaining"}</p>
        <p className="mt-1 text-2xl font-semibold">{money(trip, Math.abs(remaining))}</p>
      </div>
    </div>
  );
}
function Routes({ trip }) {
  const routes = trip.itinerary;
  const [selectedDay, setSelectedDay] = useState(routes[0]?.day);
  const destination = resolveTravelLocation(trip.destination);
  function routeStops(day) {
    const locations = orderedRouteLocations(day.activities.map(({ suggestedPlace, location, venueKind, title }) =>
      location || (suggestedPlace ? [suggestedPlace, destination].join(", ") : venueKind ? "" : title)));
    const specificStops = locations.filter((location) => location.toLowerCase() !== destination.toLowerCase());
    return specificStops.length ? specificStops : locations;
  }
  const mapRoutes = new Set(routes.map((day) => JSON.stringify(routeStops(day).map((location) => location.toLowerCase()))));
  const showDaySelector = mapRoutes.size > 1;
  const sharedRoute = routes.length > 1 && !showDaySelector;
  const route = (showDaySelector && routes.find(({ day }) => day === selectedDay)) || routes[0];
  if (!route) return <p className="notice">There are no mapped stops for this itinerary yet.</p>;

  return (
    <div>
      <p className="eyebrow">Maps and transportation</p>
      <h2 className="text-3xl font-semibold text-brand-900">Follow your local route in Google Maps.</h2>
      {showDaySelector && (
        <>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Select a day to see its itinerary stops and open local directions.</p>
          <div className="mt-6 flex gap-2 overflow-x-auto border-b border-slate-200 pb-3">
            {routes.map((item) => (
              <button key={item.day} type="button" onClick={() => setSelectedDay(item.day)} aria-pressed={route.day === item.day}
                className={`shrink-0 rounded-xl px-4 py-3 text-left ${route.day === item.day ? "bg-brand-900 text-white" : "bg-slate-50 text-slate-600"}`}>
                <span className="block text-xs font-bold">DAY {item.day}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {sharedRoute && <p className="mt-3 text-sm text-slate-500">The same route applies to all {routes.length} days.</p>}
      {trip.generation?.provider === "google-gemini" && <p className="mt-3 text-sm text-slate-500">Check that the map matches the stops suggested by Gemini before traveling.</p>}
      <div className="mt-6">
        <RouteMap locations={routeStops(route)} showEstimate={!sharedRoute} />
      </div>
    </div>
  );
}
function weatherDetails(value) {
  if (!value || typeof value === "string" || value.status === "not_checked") return { status: "Forecast not checked", text: "Refresh travel data to check forecast coverage." };
  if (value.status === "unavailable") return { status: "Weather service unavailable", text: value.error || "Try refreshing later." };
  if (!value.days?.length) return { status: "Outside forecast window", text: "Check again closer to departure." };
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
  if (!value || typeof value === "string" || value.status === "not_checked") return { status: "Holidays not checked", text: "Refresh travel data to check the selected dates." };
  if (value.status !== "available") return { status: "Holiday data unavailable", text: value.error || "Try refreshing later." };
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
  const cards = [
    ["Weather", weatherDetails(conditions.weather), conditions.weather, "OpenWeather"],
    ["Holidays", holidayDetails(conditions.holidays), conditions.holidays, "Nager.Date"],
    ["Seasonal context", seasonalDetails(conditions.seasonalContext || conditions.seasonalInsights), null, "TravelBuddy"],
  ];
  return (
    <div>
      <h2 className="text-3xl font-semibold text-brand-900">Travel conditions</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {cards.map(([title, details, feed, source]) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-brand-900">{title}</h3>
            {title === "Weather" && <WeatherVisual value={conditions.weather} />}
            <p className="mt-4 text-sm font-semibold text-brand-900">{details.status}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{details.text}</p>
            <p className="mt-3 flex flex-wrap gap-x-2 text-xs text-slate-600">
              <span>{feed?.provider || source}</span>
              <SourceTime value={feed?.fetchedAt || (feed?.status === "unavailable" ? conditions.generatedAt : null)} label="Checked" />
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
