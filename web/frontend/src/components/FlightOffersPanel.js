"use client";
import { useState } from "react";
import { api } from "@/lib/api";

// Demonstration-only conversion. Not a live foreign-exchange rate or bookable PHP fare.
const DEMO_EUR_TO_PHP = 65;
const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 });
function demoPrice(amount, currency) {
  const value = Number(amount);
  if (!Number.isFinite(value) || !currency) return "Price unavailable";
  if (currency === "PHP") return peso.format(value);
  if (currency === "EUR") return peso.format(value * DEMO_EUR_TO_PHP);
  return `${value.toFixed(2)} ${currency}`;
}
function time(value) {
  if (!value) return "—";
  // Duffel's local flight times have no timezone suffix: keep the supplied clock time.
  return value.slice(11, 16) || value;
}
function bagText(bag) {
  if (!bag?.informationAvailable) return "Baggage details unavailable";
  const items = [];
  for (const [type, label] of [["cabin", "carry-on"], ["checked", "checked"]]) {
    for (const entry of bag[type] || []) {
      items.push(`${entry.quantity ?? "?"} ${label} bag(s)${entry.maxWeightKg != null ? ` · ${entry.maxWeightKg} kg` : ""}`);
    }
  }
  return items.length ? items.join(" · ") : "Baggage details unavailable";
}

export default function FlightOffersPanel({ trip }) {
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [activeOffer, setActiveOffer] = useState(null);
  const [verification, setVerification] = useState({});
  const [seating, setSeating] = useState({});
  const [busy, setBusy] = useState("");

  async function search() {
    if (!trip?.id || searching) return;
    setSearching(true);
    setError("");
    setResults(null);
    setActiveOffer(null);
    setVerification({});
    setSeating({});
    try {
      setResults(await api(`/trips/${trip.id}/flight-offers`));
    } catch (e) {
      setError(e.message || "Flight search failed.");
    } finally {
      setSearching(false);
    }
  }

  async function verify(offerId) {
    if (busy) return;
    setBusy(`verify:${offerId}`);
    setVerification((prev) => ({ ...prev, [offerId]: null }));
    try {
      const result = await api(`/trips/${trip.id}/flight-offers/${encodeURIComponent(offerId)}/verify`, { method: "POST" });
      setVerification((prev) => ({ ...prev, [offerId]: result }));
    } catch (e) {
      setVerification((prev) => ({ ...prev, [offerId]: { status: "ERROR", message: e.message || "Unable to verify price." } }));
    } finally {
      setBusy("");
    }
  }

  async function seats(offerId) {
    if (busy) return;
    if (activeOffer === offerId) { setActiveOffer(null); return; }
    setActiveOffer(offerId);
    if (seating[offerId]) return;
    setBusy(`seats:${offerId}`);
    try {
      const result = await api(`/trips/${trip.id}/flight-offers/${encodeURIComponent(offerId)}/seat-maps`);
      setSeating((prev) => ({ ...prev, [offerId]: result }));
    } catch (e) {
      setSeating((prev) => ({ ...prev, [offerId]: { error: e.message || "Seat maps unavailable." } }));
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-label="Demo flight offers">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Module 7 · Philippine flight demo</p>
          <h3 className="mt-1 text-xl font-semibold text-brand-900">Explore flight offers</h3>
          <p className="mt-1 text-sm text-slate-600">Sandbox flight offers for your trip. No tickets are booked or reserved.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={search} disabled={searching || !trip?.includeFlights}>
          {searching ? "Searching…" : results ? "Search again" : "Search flights"}
        </button>
      </div>
      <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
        Demo prices only. EUR fares are displayed in PHP using a fixed illustrative rate of €1 = ₱65; not live exchange rates, real PHP ticket quotes, or guaranteed airline availability.
      </p>
      {!trip?.includeFlights && <p className="mt-3 text-sm text-slate-600">Enable flights for this trip to search offers.</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {results && <p className="mt-4 text-sm text-slate-600">{results.search?.origin} → {results.search?.destination} · {results.offers?.length ?? 0} offer(s) · Duffel Sandbox</p>}
      {results && !results.offers?.length && <p className="mt-3 text-sm text-slate-600">No sandbox offers found. Try another trip or travel date.</p>}
      <div className="mt-4 space-y-4">
        {(results?.offers || []).map((offer) => {
          const checked = verification[offer.id];
          const map = seating[offer.id];
          return (
            <article key={offer.id} className="rounded-xl border border-slate-200 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="font-semibold text-brand-900">{offer.slices?.[0]?.segments?.[0]?.airline || "Flight offer"}</p><p className="text-xs text-slate-500">Round-trip offer · Test inventory</p></div>
                <div className="text-right"><p className="text-2xl font-bold text-brand-900">{demoPrice(offer.totalAmount, offer.totalCurrency)}</p><p className="text-xs text-slate-500">Original sandbox quote: {offer.totalAmount} {offer.totalCurrency}</p></div>
              </div>
              {(offer.slices || []).map((slice, sliceIndex) => (
                <div key={sliceIndex} className="mt-4 border-t border-slate-100 pt-3">
                  <p className="mb-2 text-sm font-semibold text-brand-900">{sliceIndex === 0 ? "Outbound" : sliceIndex === 1 ? "Return" : `Leg ${sliceIndex + 1}`} · {slice.origin} → {slice.destination}</p>
                  {(slice.segments || []).map((segment, segmentIndex) => (
                    <div key={segment.id || segmentIndex} className="mb-3 rounded-lg bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium">{segment.flightNumber || "Flight"} · {segment.airline || "Airline unavailable"}</span><span className="text-sm font-semibold">{time(segment.departingAt)} → {time(segment.arrivingAt)}</span></div>
                      <p className="mt-1 text-xs text-slate-600">{segment.origin} → {segment.destination} · {segment.departingAt?.slice(0, 10)}</p>
                      <p className="mt-2 text-xs text-slate-600">Baggage: {bagText(segment.baggage)}</p>
                    </div>
                  ))}
                </div>
              ))}
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn btn-outline" disabled={Boolean(busy)} onClick={() => verify(offer.id)}>{busy === `verify:${offer.id}` ? "Verifying…" : "Verify price"}</button>
                <button type="button" className="btn btn-outline" disabled={Boolean(busy) && busy !== `seats:${offer.id}`} onClick={() => seats(offer.id)}>{busy === `seats:${offer.id}` ? "Loading seats…" : activeOffer === offer.id ? "Hide seat details" : "View seat details"}</button>
              </div>
              {checked && <div role="status" className="mt-3 rounded-lg bg-slate-50 p-3 text-sm"><strong>Price check: {checked.status}</strong><p className="mt-1">{checked.message}</p>{checked.price?.totalAmount != null && <p className="mt-1">Updated demo price: {demoPrice(checked.price.totalAmount, checked.price.totalCurrency)} <span className="text-xs text-slate-500">({checked.price.totalAmount} {checked.price.totalCurrency})</span></p>}{checked.valid && <p className="mt-1 text-xs text-slate-500">Offer not expired at verification time; no booking or seat reservation made.</p>}</div>}
              {activeOffer === offer.id && <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm" role="status">
                {busy === `seats:${offer.id}` ? "Loading seat maps…" : map?.error ? map.error : !map ? "Loading seat maps…" : !map.seatMapsAvailable ? "Seat maps are not provided for this offer." : <><p className="font-semibold">{map.seatMaps?.length ?? 0} seat map(s) returned</p><p className="mt-1 text-xs text-slate-600">Seat services shown below indicate selectable seats, not a total remaining-seat count.</p>{(map.seatMaps || []).map((m, i) => { const seats = (m.cabins || []).flatMap(c => (c.rows || []).flatMap(r => (r.sections || []).flatMap(s => (s.elements || []).filter(e => e.type === "seat")))); return <p key={m.id || i} className="mt-2">Map {i + 1}: {seats.length} mapped seats · {seats.filter(s => s.selectable).length} with selection services</p>; })}</>}
              </div>}
            </article>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-slate-500">Flight selection and itinerary saving will be added in the next step. Prices and seat availability can change or expire.</p>
    </section>
  );
}
