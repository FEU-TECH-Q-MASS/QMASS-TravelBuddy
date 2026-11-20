"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Icon from "@/components/Icon";
import DestinationField from "@/components/DestinationField";
import TripOptionField from "@/components/TripOptionField";
import TripTransport from "@/components/TripTransport";
import { useSiteAuth } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { findDestination, getTripTransport, originOptions } from "@/lib/travelOptions";
import { clearTripPreview, readTripPreview, saveTripPreview } from "@/lib/tripPlannerDraft";
import { authHref, newTripHref, newTripPath, tripDestinationCode } from "@/lib/tripPlannerNavigation";
import { createTripSummary, interestOptions, maxTravelers, tripCurrency, validateTravelers, validateBudget } from "@/lib/tripPlanning";

const budgetAmountFormat = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 });
const pesoFormat = new Intl.NumberFormat("en-PH", { style: "currency", currency: tripCurrency });
const defaultBudget = 10000;

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
  const [origin, setOrigin] = useState(draft?.origin ?? "");
  const [selectedDestination, setSelectedDestination] = useState(destination || tripDestinationCode(draft?.destination));
  const transport = getTripTransport(origin, selectedDestination);
  const canBudgetForFlights = Boolean(transport?.route);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [departure, setDeparture] = useState(draft?.departure ?? "");
  const needsPesoBudget = Boolean(draft?.currency && draft.currency !== tripCurrency);
  const [travelers, setTravelers] = useState(String(draft?.travelers ?? 1));
  const [budget, setBudget] = useState(() => {
    if (needsPesoBudget) return "";
    const initial = draft?.budget ?? defaultBudget;
    const { value } = validateBudget(initial);
    return value === undefined ? String(initial) : budgetAmountFormat.format(value);
  });
  const [checkedNumbers, setCheckedNumbers] = useState({});
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (inFlight.current) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const values = {
      origin,
      destination: selectedDestination === "PAL" ? "" : selectedDestination,
      departure: data.get("departure"),
      returnDate: data.get("returnDate"),
      travelers: data.get("travelers"),
      budget: data.get("budget"),
      currency: tripCurrency,
      includeFlights: data.has("includeFlights"),
      interests: data.getAll("interests"),
    };
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const { summary, errors: validationErrors } = createTripSummary(values, today);
    const fieldErrors = values.origin ? validationErrors : { origin: "Choose a starting point.", ...validationErrors };
    if (selectedDestination === "PAL") fieldErrors.destination = "Choose a base in Palawan.";
    setErrors(fieldErrors);
    setCheckedNumbers({ travelers: true, budget: true });
    setNotice("");
    if (Object.keys(fieldErrors).length) {
      const firstField = Object.keys(fieldErrors)[0];
      const fieldId = firstField === "destination" && selectedDestination === "PAL" ? "destination-base" : firstField;
      (form.querySelector(`#${fieldId}`) || form.elements.namedItem(firstField))?.focus();
      return;
    }

    const validatedValues = { ...values, travelers: summary.travelers, budget: summary.budget };
    if (!creating) {
      setPreview({ summary, values: validatedValues });
      requestAnimationFrame(() => resultRef.current?.focus());
      return;
    }

    inFlight.current = true;
    setSaving(true);
    try {
      const { trip } = await api("/trips", { method: "POST", body: JSON.stringify(validatedValues) });
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

  function clearPreview() {
    setPreview(null);
    setNotice("");
  }

  function fieldProps(name) {
    return { "aria-invalid": Boolean(errors[name]), "aria-describedby": errors[name] ? `${name}-error` : undefined };
  }

  const travelerCount = /^\d+$/.test(travelers.trim()) ? Number(travelers) : null;
  const travelersError = checkedNumbers.travelers && validateTravelers(travelers).error;
  const budgetError = checkedNumbers.budget && validateBudget(budget).error;
  const summary = preview?.summary;

  function stepTravelers(direction) {
    const next = travelerCount === null ? 1 : Math.min(maxTravelers, Math.max(1, travelerCount + direction));
    setTravelers(String(next));
    setCheckedNumbers((current) => ({ ...current, travelers: true }));
    clearPreview();
  }

  function checkBudget(event) {
    setCheckedNumbers((current) => ({ ...current, budget: true }));
    const amount = event.currentTarget.value;
    const { value } = validateBudget(amount);
    setBudget(value === undefined ? amount : budgetAmountFormat.format(value));
  }

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
        <form onSubmit={submit} onChange={clearPreview} noValidate aria-busy={saving}>
          <fieldset disabled={saving} className="min-w-0">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <TripOptionField id="origin" label="Starting point" placeholder="Choose starting point" options={originOptions}
                value={origin} onChange={(code) => { setOrigin(code); clearPreview(); }} error={errors.origin} />
              <DestinationField value={selectedDestination} onChange={(code) => { setSelectedDestination(code); clearPreview(); }} error={errors.destination} />
              <label className="field-label">Departure
                <input className="input mt-2" name="departure" type="date" required value={departure} onChange={(event) => setDeparture(event.target.value)} {...fieldProps("departure")} />
                {error("departure")}
              </label>
              <label className="field-label">Return
                <input className="input mt-2" name="returnDate" type="date" defaultValue={draft?.returnDate ?? ""} min={departure || undefined} required {...fieldProps("returnDate")} />
                {error("returnDate")}
              </label>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <div className="min-w-0">
                <label htmlFor="travelers" className="field-label">Travelers</label>
                <div className={`flex min-h-12 items-stretch rounded-xl border bg-white focus-within:border-brand-700 ${travelersError ? "border-red-500" : "border-slate-200"}`}>
                  <button type="button" aria-label="Remove a traveler" disabled={travelerCount === 1} onClick={() => stepTravelers(-1)}
                    className="w-12 shrink-0 rounded-l-xl border-r border-slate-200 text-lg font-semibold text-brand-900 hover:bg-brand-50 disabled:text-slate-400 disabled:hover:bg-transparent">−</button>
                  <input id="travelers" name="travelers" type="text" inputMode="numeric" required value={travelers}
                    onChange={(event) => setTravelers(event.target.value)}
                    onBlur={() => setCheckedNumbers((current) => ({ ...current, travelers: true }))}
                    aria-invalid={Boolean(travelersError)} aria-describedby={travelersError ? "travelers-hint travelers-error" : "travelers-hint"}
                    className="min-w-0 flex-1 px-2 text-center text-sm font-semibold text-slate-900 outline-offset-[-2px]" />
                  <button type="button" aria-label="Add a traveler" disabled={travelerCount === maxTravelers} onClick={() => stepTravelers(1)}
                    className="w-12 shrink-0 rounded-r-xl border-l border-slate-200 text-lg font-semibold text-brand-900 hover:bg-brand-50 disabled:text-slate-400 disabled:hover:bg-transparent">+</button>
                </div>
                <p id="travelers-hint" className="mt-1.5 text-xs text-slate-500">1–{maxTravelers} travelers</p>
                {travelersError && <p id="travelers-error" className="mt-1 text-xs text-red-700">{travelersError}</p>}
              </div>
              <div className="min-w-0">
                <label htmlFor="budget" className="field-label">Total trip budget</label>
                <div className={`flex min-h-12 items-stretch rounded-xl border bg-white focus-within:border-brand-700 ${budgetError ? "border-red-500" : "border-slate-200"}`}>
                  <span aria-hidden="true" className="grid w-12 shrink-0 place-items-center rounded-l-xl border-r border-slate-200 bg-slate-50 text-sm font-semibold text-brand-900">₱</span>
                  <input id="budget" name="budget" type="text" inputMode="decimal"
                    required value={budget} onChange={(event) => setBudget(event.target.value)} onBlur={checkBudget}
                    aria-invalid={Boolean(budgetError)} aria-describedby={budgetError ? "budget-hint budget-error" : "budget-hint"}
                    className="min-w-0 flex-1 rounded-r-xl px-4 py-3 text-sm text-slate-900 outline-offset-[-2px]" />
                </div>
                <p id="budget-hint" className="mt-1.5 text-xs text-slate-500">
                  Total for the whole group, in Philippine pesos.
                  {needsPesoBudget && !budget && " Enter a peso amount for this draft."}
                </p>
                {budgetError && <p id="budget-error" className="mt-1 text-xs text-red-700">{budgetError}</p>}
              </div>
            </div>
            {transport && !summary && <div className="mt-5"><TripTransport origin={origin} destination={selectedDestination} /></div>}
            <div className="mt-5 flex flex-col justify-between gap-5 border-t border-slate-100 pt-5 xl:flex-row xl:items-end">
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
              <button className="btn btn-primary shrink-0 disabled:opacity-60" type="submit">
                {saving ? "Creating trip…" : creating ? "Generate my trip" : "Preview my trip"} <Icon name="spark" size={18} />
              </button>
            </div>
            {canBudgetForFlights && <label className="mt-5 flex items-center gap-2 text-xs text-slate-600">
              <input name="includeFlights" type="checkbox" defaultChecked={draft?.includeFlights} className="h-4 w-4" /> Include an airfare allowance in my budget
            </label>}
          </fieldset>
        </form>
        {notice && <p className="notice mt-6" role="alert">{notice}</p>}
        {summary && (
          <div ref={resultRef} tabIndex={-1} role="status" className="notice mt-6" aria-label="Your trip summary">
            <h3 className="text-lg font-semibold">Your trip to {findDestination(summary.destination)?.name ?? summary.destination}</h3>
            <p className="mt-2">{summary.departure} to {summary.returnDate} · {summary.days} {summary.days === 1 ? "day" : "days"}, {summary.nights} {summary.nights === 1 ? "night" : "nights"}</p>
            <p>Total budget · {pesoFormat.format(summary.budget)}{canBudgetForFlights && ` · Airfare ${summary.includeFlights ? "included" : "excluded"}`}</p>
            <p>Interests · {summary.interests.join(", ") || "Open to anything"}</p>
            <div className="mt-4">
              <TripTransport origin={preview.values.origin} destination={summary.destination}
                departure={summary.departure} returnDate={summary.returnDate} showSearch />
            </div>
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
