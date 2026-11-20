"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Icon from "@/components/Icon";
import { useSiteAuth } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { airportOptions, destinationOptions } from "@/lib/travelOptions";
import { clearTripPreview, readTripPreview, saveTripPreview } from "@/lib/tripPlannerDraft";
import { authHref, newTripHref, newTripPath, tripDestinationCode } from "@/lib/tripPlannerNavigation";
import { createTripSummary, currencies, interestOptions, minimumBudgets } from "@/lib/tripPlanning";

export default function TripPlanner({ initialDestination = "", mode = "preview", resumePreview = false }) {
  const { user, profile } = useSiteAuth();
  const destination = tripDestinationCode(initialDestination);

  if (mode === "preview" && profile?.role === "traveler") {
    return (
      <section id="plan-trip" aria-labelledby="planner-title" className="page-width relative z-10 -mt-16 scroll-mt-28">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-lg">
          <h2 id="planner-title" className="text-lg font-semibold text-brand-900">Plan your Philippine trip</h2>
          <Link href={newTripHref({ destination })} className="btn btn-primary">Plan a trip <Icon name="arrow" size={16} /></Link>
        </div>
      </section>
    );
  }

  return <TripPlannerForm key={destination} destination={destination} creating={mode === "create"}
    resumePreview={resumePreview} canContinue={!user} />;
}

function TripPlannerForm({ destination, creating, resumePreview, canContinue }) {
  const router = useRouter();
  const resultRef = useRef(null);
  const inFlight = useRef(false);
  const [draft] = useState(() => resumePreview ? readTripPreview() : null);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [departure, setDeparture] = useState(draft?.departure ?? "");
  const [currency, setCurrency] = useState(currencies.includes(draft?.currency) ? draft.currency : "PHP");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (inFlight.current) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const values = {
      ...Object.fromEntries(data),
      includeFlights: data.has("includeFlights"),
      interests: data.getAll("interests"),
    };
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const { summary, errors: validationErrors } = createTripSummary(values, today);
    const fieldErrors = values.origin ? validationErrors : { origin: "Choose a starting airport.", ...validationErrors };
    setErrors(fieldErrors);
    setNotice("");
    if (Object.keys(fieldErrors).length) {
      form.elements.namedItem(Object.keys(fieldErrors)[0])?.focus();
      return;
    }

    if (!creating) {
      setPreview({ summary, values });
      requestAnimationFrame(() => resultRef.current?.focus());
      return;
    }

    inFlight.current = true;
    setSaving(true);
    try {
      const { trip } = await api("/trips", { method: "POST", body: JSON.stringify(values) });
      if (resumePreview) clearTripPreview();
      router.push(`/trips/${trip.id}`);
    } catch (error) {
      setNotice(error.message);
      inFlight.current = false;
      setSaving(false);
    }
  }

  function continueToSignIn() {
    if (!saveTripPreview(preview.values)) {
      setNotice("Your browser couldn’t keep this preview. Try again, or log in to start a new trip.");
      return;
    }
    router.push(authHref("/login", newTripHref({ draft: true })));
  }

  function error(name) {
    return errors[name] && <span id={`${name}-error`} className="mt-2 block text-xs text-red-700">{errors[name]}</span>;
  }

  function fieldProps(name) {
    return { "aria-invalid": Boolean(errors[name]), "aria-describedby": errors[name] ? `${name}-error` : undefined };
  }

  const minimum = minimumBudgets[currency];
  const budgetFormat = new Intl.NumberFormat("en-PH", { style: "currency", currency, maximumFractionDigits: 0 });
  const summary = preview?.summary;

  return (
    <section id="plan-trip" aria-labelledby="planner-title" className={creating ? "mt-8" : "page-width relative z-10 -mt-16 scroll-mt-28"}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 id="planner-title" className="flex items-center gap-2 text-base font-semibold">
            <Icon name="compass" className="text-brand-700" /> {creating ? "Trip details" : "Preview your Philippine trip"}
          </h2>
          {!creating && <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">Free preview</span>}
        </div>
        {resumePreview && !draft && (
          <p role="status" className="notice mb-5">Your preview is no longer available in this tab. Enter your trip details below.</p>
        )}
        <form onSubmit={submit} onChange={() => { setPreview(null); setNotice(""); }} noValidate aria-busy={saving}>
          <fieldset disabled={saving} className="min-w-0">
            <div className={`grid gap-4 sm:grid-cols-2 ${creating ? "lg:grid-cols-3" : "lg:grid-cols-[1.2fr_1.2fr_1fr_1fr_0.7fr_1fr]"}`}>
              <label className="field-label">Starting airport
                <select className="input mt-2" name="origin" defaultValue={draft?.origin ?? ""} required {...fieldProps("origin")}>
                  <option value="">Choose airport</option>
                  {airportOptions.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                </select>
                {error("origin")}
              </label>
              <label className="field-label">Destination
                <select className="input mt-2" name="destination" defaultValue={destination || tripDestinationCode(draft?.destination)} required {...fieldProps("destination")}>
                  <option value="">Choose destination</option>
                  {destinationOptions.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                </select>
                {error("destination")}
              </label>
              <label className="field-label">Departure
                <input className="input mt-2" name="departure" type="date" required value={departure} onChange={(event) => setDeparture(event.target.value)} {...fieldProps("departure")} />
                {error("departure")}
              </label>
              <label className="field-label">Return
                <input className="input mt-2" name="returnDate" type="date" defaultValue={draft?.returnDate ?? ""} min={departure || undefined} required {...fieldProps("returnDate")} />
                {error("returnDate")}
              </label>
              <label className="field-label">Travelers
                <input className="input mt-2" name="travelers" type="number" min="1" max="99" defaultValue={draft?.travelers ?? 1} required {...fieldProps("travelers")} />
                {error("travelers")}
              </label>
              <label className="field-label">Budget
                <input className="input mt-2" name="budget" type="number" min={minimum} max="1000000000" step={currency === "JPY" ? "1" : "0.01"} defaultValue={draft?.budget ?? 10000} required {...fieldProps("budget")} />
                {error("budget")}
              </label>
            </div>
            <div className="mt-5 flex flex-col justify-between gap-5 border-t border-slate-100 pt-5 xl:flex-row xl:items-end">
              <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
                <label className="field-label">Currency
                  <select className="input mt-2" name="currency" value={currency} onChange={(event) => setCurrency(event.target.value)} {...fieldProps("currency")}>
                    {currencies.map((value) => <option key={value}>{value}</option>)}
                  </select>
                  <span className="mt-1 block text-xs font-normal text-slate-500">Minimum {budgetFormat.format(minimum)}</span>
                  {error("currency")}
                </label>
                <fieldset>
                  <legend className="field-label">Interests <span className="font-normal text-slate-500">(optional)</span></legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {interestOptions.map((value) => (
                      <label key={value} className="cursor-pointer">
                        <input type="checkbox" name="interests" value={value} defaultChecked={draft?.interests.includes(value)} className="peer sr-only" />
                        <span className="block rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 peer-checked:border-brand-700 peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-focus-visible:outline-2 peer-focus-visible:outline-brand-700">{value}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
              <button className="btn btn-primary shrink-0 disabled:opacity-60" type="submit">
                {saving ? "Creating trip…" : creating ? "Generate my trip" : "Preview my trip"} <Icon name="spark" size={18} />
              </button>
            </div>
            <label className="mt-5 flex items-center gap-2 text-xs text-slate-600">
              <input name="includeFlights" type="checkbox" defaultChecked={draft?.includeFlights} className="h-4 w-4" /> Include airfare in my total budget
            </label>
          </fieldset>
        </form>
        {notice && <p className="notice mt-6" role="alert">{notice}</p>}
        {summary && (
          <div ref={resultRef} tabIndex={-1} role="status" className="notice mt-6" aria-label="Your trip summary">
            <h3 className="text-lg font-semibold">Your trip to {destinationOptions.find(([code]) => code === summary.destination)?.[1] ?? summary.destination}</h3>
            <p className="mt-2">{summary.departure} to {summary.returnDate} · {summary.days} {summary.days === 1 ? "day" : "days"}, {summary.nights} {summary.nights === 1 ? "night" : "nights"}</p>
            <p>Total budget · {new Intl.NumberFormat("en-PH", { style: "currency", currency: summary.currency }).format(summary.budget)} · Airfare {summary.includeFlights ? "included" : "excluded"}</p>
            <p>Interests · {summary.interests.join(", ") || "Open to anything"}</p>
            {canContinue && (
              <div className="mt-4 border-t border-cyan-200 pt-4">
                <p className="text-xs">Sign in to review these details and save your trip.</p>
                <button type="button" onClick={continueToSignIn} className="btn btn-dark mt-4">Sign in to continue <Icon size={16} /></button>
                {notice && <Link href={authHref("/login", newTripPath)} className="text-link ml-3">Log in to start fresh</Link>}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
