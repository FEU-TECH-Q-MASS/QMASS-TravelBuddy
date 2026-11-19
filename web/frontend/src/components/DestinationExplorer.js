"use client";
import { useState } from "react";
import DestinationCard from "./DestinationCard";
import Icon from "@/components/Icon";
import { destinations } from "@/lib/destinations";
import { interestOptions } from "@/lib/tripPlanning";

export default function DestinationExplorer() {
  const [interest, setInterest] = useState("All");
  const [search, setSearch] = useState("");
  const filtered = destinations.filter(
    (item) =>
      (interest === "All" || item.interests.includes(interest)) &&
      `${item.name} ${item.country}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  function reset() {
    setInterest("All");
    setSearch("");
  }
  return (
    <section
      className="page-width py-12 sm:py-16"
      aria-label="Destination explorer"
    >
      <div className="flex flex-col justify-between gap-6 border-b border-slate-100 pb-7 md:flex-row md:items-end">
        <fieldset>
          <legend className="field-label mb-3">Find your kind of escape</legend>
          <div className="flex flex-wrap gap-2">
            {["All", ...interestOptions].map((value) => (
              <button
                type="button"
                className="filter-pill"
                aria-pressed={interest === value}
                onClick={() => setInterest(value)}
                key={value}
              >
                {value === "All" ? "All destinations" : value}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="w-full md:w-64">
          <label htmlFor="destination-search" className="field-label">
            Search destinations
          </label>
          <div className="field-icon">
            <Icon name="pin" size={18} />
            <input
              id="destination-search"
              className="input"
              placeholder="Search by name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </div>
      <p role="status" className="my-6 text-xs text-slate-500">
        {filtered.length}{" "}
        {filtered.length === 1 ? "destination" : "destinations"} to spark an
        idea
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((destination) => (
          <DestinationCard
            key={destination.slug}
            destination={destination}
            large
          />
        ))}
      </div>
      {!filtered.length && (
        <div className="rounded-2xl bg-brand-50 px-6 py-16 text-center">
          <Icon
            name="compass"
            className="mx-auto mb-4 text-brand-700"
            size={36}
          />
          <h2 className="text-2xl font-semibold">
            A different direction, perhaps?
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            Try another interest or search term.
          </p>
          <button onClick={reset} className="btn btn-dark mt-6" type="button">
            Clear filters
          </button>
        </div>
      )}
      <p className="mt-7 text-xs leading-6 text-slate-500">
        These are curated ideas to help you explore. Destination previews are
        illustrative and do not confirm availability, entry requirements, safety
        conditions, or current prices.
      </p>
    </section>
  );
}
