"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { airportOptions, destinationOptions } from "@/lib/travelOptions";
import Icon from "@/components/Icon";

const minimumBudgets = { PHP: 10000, USD: 20, EUR: 20, JPY: 3000 };

export default function TripEditForm({ trip, onSave, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState(trip.currency);
  const [departure, setDeparture] = useState(trip.departure);
  const fieldId = (name) => `trip-${trip.id}-${name}`;

  async function save(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      const { trip: updated } = await api(`/trips/${trip.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          origin: data.get("origin"), destination: data.get("destination"),
          departure: data.get("departure"), returnDate: data.get("returnDate"),
          travelers: Number(data.get("travelers")), budget: Number(data.get("budget")),
          currency: data.get("currency"), includeFlights: data.get("includeFlights") === "on",
        }),
      });
      onSave(updated);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-5 border-t border-slate-100 pt-5" aria-label={`Edit trip to ${trip.destination}`}>
      <h4 className="flex items-center gap-2 font-semibold text-brand-900"><Icon name="edit" size={16} /> Edit trip</h4>
      <p className="mt-2 text-xs leading-5 text-slate-500">Saving rebuilds your itinerary preview, routes, and estimates using these details. Trips can be up to 14 days.</p>
      <fieldset disabled={saving} className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 disabled:opacity-60">
        {[["origin", "From", airportOptions], ["destination", "Destination", destinationOptions]].map(([name, label, options]) => (
          <div key={name}>
            <label htmlFor={fieldId(name)} className="field-label">{label}</label>
            <select id={fieldId(name)} name={name} defaultValue={trip[name]} className="input" required>
              {!options.some(([value]) => value === trip[name]) && <option value={trip[name]}>{trip[name]}</option>}
              {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </div>
        ))}
        <div>
          <label htmlFor={fieldId("departure")} className="field-label">Departure</label>
          <input id={fieldId("departure")} name="departure" type="date" value={departure} onChange={(e) => setDeparture(e.target.value)} required className="input" />
        </div>
        <div>
          <label htmlFor={fieldId("returnDate")} className="field-label">Return date</label>
          <input id={fieldId("returnDate")} name="returnDate" type="date" defaultValue={trip.returnDate} min={departure} required className="input" />
        </div>
        <div>
          <label htmlFor={fieldId("travelers")} className="field-label">Travelers</label>
          <input id={fieldId("travelers")} name="travelers" type="number" min="1" max="50" step="1" defaultValue={trip.travelers} required className="input" />
        </div>
        <div>
          <label htmlFor={fieldId("currency")} className="field-label">Currency</label>
          <select id={fieldId("currency")} name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="input">
            {Object.keys(minimumBudgets).map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={fieldId("budget")} className="field-label">Total budget ({currency})</label>
          <input id={fieldId("budget")} name="budget" type="number" min={minimumBudgets[currency]} step="0.01" defaultValue={trip.budget} required className="input" />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
          <input name="includeFlights" type="checkbox" defaultChecked={trip.includeFlights} /> Include flights in the budget
        </label>
      </fieldset>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className="btn btn-dark disabled:cursor-wait disabled:opacity-60"><Icon name="check" size={16} />{saving ? "Saving…" : "Save changes"}</button>
        <button type="button" onClick={onCancel} disabled={saving} className="btn btn-outline disabled:opacity-60">Cancel</button>
      </div>
    </form>
  );
}
