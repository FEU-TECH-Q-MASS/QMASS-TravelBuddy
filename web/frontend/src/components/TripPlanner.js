"use client";
import { useRef, useState } from "react";
import Icon from "@/components/Icon";
import {
  createTripSummary,
  currencies,
  interestOptions,
} from "@/lib/tripPlanning";

export default function TripPlanner({ initialDestination = "" }) {
  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState(null);
  const [departure, setDeparture] = useState("");
  const resultRef = useRef(null);
  function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const result = createTripSummary(
      {
        ...Object.fromEntries(data),
        includeFlights: data.has("includeFlights"),
        interests: data.getAll("interests"),
      },
      today,
    );
    setErrors(result.errors);
    setSummary(result.summary);
    if (result.summary) requestAnimationFrame(() => resultRef.current?.focus());
    else
      event.currentTarget.elements
        .namedItem(Object.keys(result.errors)[0])
        ?.focus();
  }
  function error(name) {
    return (
      errors[name] && (
        <p id={`${name}-error`} className="mt-2 text-xs text-red-700">
          {errors[name]}
        </p>
      )
    );
  }
  const props = (name) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });
  return (
    <section
      id="plan-trip"
      aria-labelledby="planner-title"
      className="page-width relative z-10 -mt-16 scroll-mt-28"
    >
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_16px_70px_-25px_rgba(9,45,61,0.3)] sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="planner-title"
            className="flex items-center gap-2 text-base font-semibold"
          >
            <Icon name="compass" className="text-brand-700" /> Your next
            adventure starts here
          </h2>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-700">
            Trip preferences preview
          </span>
        </div>
        <form onSubmit={submit} onChange={() => setSummary(null)} noValidate>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_0.65fr_1fr]">
            <div>
              <label htmlFor="destination" className="field-label">
                Where to?
              </label>
              <div className="field-icon">
                <Icon name="pin" size={18} />
                <input
                  id="destination"
                  name="destination"
                  className="input"
                  placeholder="City or destination"
                  maxLength={100}
                  required
                  defaultValue={initialDestination}
                  {...props("destination")}
                />
              </div>
              {error("destination")}
            </div>
            <div>
              <label htmlFor="departure" className="field-label">
                Departure
              </label>
              <input
                id="departure"
                name="departure"
                type="date"
                className="input"
                required
                value={departure}
                onChange={(event) => setDeparture(event.target.value)}
                {...props("departure")}
              />
              {error("departure")}
            </div>
            <div>
              <label htmlFor="returnDate" className="field-label">
                Return
              </label>
              <input
                id="returnDate"
                name="returnDate"
                type="date"
                className="input"
                min={departure || undefined}
                required
                {...props("returnDate")}
              />
              {error("returnDate")}
            </div>
            <div>
              <label htmlFor="travelers" className="field-label">
                Travelers
              </label>
              <input
                id="travelers"
                name="travelers"
                type="number"
                min="1"
                max="99"
                defaultValue="1"
                className="input"
                required
                {...props("travelers")}
              />
              {error("travelers")}
            </div>
            <div>
              <label htmlFor="budget" className="field-label">
                Total trip budget
              </label>
              <input
                id="budget"
                name="budget"
                type="number"
                min="0.01"
                max="1000000000"
                step="0.01"
                placeholder="Your budget"
                  defaultValue="10000"
                className="input"
                required
                {...props("budget")}
              />
              {error("budget")}
            </div>
          </div>
          <div className="mt-5 flex flex-col justify-between gap-5 border-t border-slate-100 pt-5 xl:flex-row xl:items-end">
            <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
              <div>
                <label htmlFor="currency" className="field-label">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  {...props("currency")}
                >
                  {currencies.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                {error("currency")}
              </div>
              <fieldset>
                <legend className="field-label">
                  What do you love?{" "}
                  <span className="font-normal text-slate-400">(optional)</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map((value) => (
                    <label key={value} className="cursor-pointer">
                      <input
                        type="checkbox"
                        name="interests"
                        value={value}
                        className="peer sr-only"
                      />
                      <span className="block rounded-full border border-slate-200 px-3 py-2 text-[11px] text-slate-600 peer-checked:border-brand-700 peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-700">
                        {value}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <button className="btn btn-primary shrink-0" type="submit">
              Preview My Trip <Icon name="spark" size={18} />
            </button>
          </div>
          <label className="mt-5 flex items-center gap-2 text-xs text-slate-500">
            <input name="includeFlights" type="checkbox" className="h-4 w-4" />{" "}
            Include airfare in my total budget
          </label>
        </form>
        {summary && (
          <div
            ref={resultRef}
            tabIndex={-1}
            role="status"
            className="notice mt-6"
            aria-label="Your trip summary"
          >
            <h3 className="text-lg font-semibold">
              Your trip to {summary.destination}
            </h3>
            <p className="mt-2">
              {summary.departure} to {summary.returnDate} · {summary.days}{" "}
              {summary.days === 1 ? "day" : "days"}, {summary.nights}{" "}
              {summary.nights === 1 ? "night" : "nights"} · {summary.travelers}{" "}
              {summary.travelers === 1 ? "traveler" : "travelers"}
            </p>
            <p className="mt-2">
              Total budget:{" "}
              {new Intl.NumberFormat("en", {
                style: "currency",
                currency: summary.currency,
              }).format(summary.budget)}{" "}
              · Airfare {summary.includeFlights ? "included" : "excluded"}
            </p>
            <p>
              Interests: {summary.interests.join(", ") || "Open to anything"}
            </p>
            <p className="mt-3 border-t border-cyan-200 pt-3 text-xs">
              This is a preview of your preferences. Live itinerary generation
              and saving trips are not available yet. Your inputs have not been
              submitted or saved.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
