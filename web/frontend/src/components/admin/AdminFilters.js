"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FiChevronDown, FiFilter, FiSearch, FiX } from "react-icons/fi";

export default function AdminFilters({ filters, fields, searchLabel, searchPlaceholder, disabled, onApply }) {
  const [draft, setDraft] = useState(null);
  const panel = useRef(null);
  const trigger = useRef(null);
  const search = useRef(null);
  const panelId = useId();
  const open = draft !== null;
  const applied = new URLSearchParams(filters);
  const active = fields.filter(({ name }) => applied.has(name));

  useEffect(() => {
    if (!open) return;
    const dialog = panel.current;
    const desktop = window.matchMedia("(min-width: 640px)");

    function showPanel() {
      if (dialog.open) dialog.close();
      if (desktop.matches) dialog.show();
      else dialog.showModal();
    }

    function dismissOutside(event) {
      if (desktop.matches) {
        if (!dialog.contains(event.target) && !trigger.current?.contains(event.target)) setDraft(null);
      } else if (event.target === dialog) {
        const bounds = dialog.getBoundingClientRect();
        if (event.clientY < bounds.top) setDraft(null);
      }
    }

    function dismissOnEscape(event) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      dialog.close();
      trigger.current?.focus();
      setDraft(null);
    }

    showPanel();
    desktop.addEventListener("change", showPanel);
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      desktop.removeEventListener("change", showPanel);
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
      dialog.close();
    };
  }, [open]);

  function apply(event) {
    event.preventDefault();
    const query = new URLSearchParams();
    for (const [name, value] of new FormData(event.currentTarget)) {
      const trimmed = value.trim();
      if (trimmed) query.set(name, trimmed);
    }
    if (open) trigger.current?.focus();
    setDraft(null);
    onApply(query.toString());
  }

  function clear() {
    search.current.value = "";
    trigger.current?.focus();
    setDraft(null);
    onApply("");
  }

  return (
    <form onSubmit={apply}>
      <fieldset disabled={disabled} className="relative flex min-w-0 items-center justify-between gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <input ref={search} name="search" type="search" aria-label={searchLabel} maxLength={254}
            defaultValue={applied.get("search") ?? ""} placeholder={searchPlaceholder} className="input h-11! pr-12!" />
          <button type="submit" aria-label={searchLabel} className="absolute inset-y-1 right-1 grid w-9 place-items-center rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-900">
            <FiSearch size={17} aria-hidden="true" />
          </button>
        </div>
        <button ref={trigger} type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls={panelId}
          onClick={() => setDraft(open ? null : {})}
          className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors hover:border-brand-700 disabled:opacity-50 ${open || active.length ? "border-brand-700 bg-brand-50 text-brand-900" : "border-slate-200 bg-white text-slate-700"}`}>
          <FiFilter size={16} aria-hidden="true" />
          Filters
          {active.length > 0 && <span className="rounded-full bg-brand-700 px-1.5 text-xs text-white">{active.length}</span>}
          <FiChevronDown size={14} aria-hidden="true" className="hidden sm:block" />
        </button>
        <dialog
          ref={panel}
          id={panelId}
          aria-labelledby={panelId + "-title"}
          onCancel={(event) => {
            event.preventDefault();
            event.currentTarget.close();
            trigger.current?.focus();
            setDraft(null);
          }}
          className="fixed inset-x-0 top-auto bottom-0 z-20 m-0 max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-lg backdrop:bg-slate-950/40 sm:absolute sm:top-full sm:right-0 sm:bottom-auto sm:left-auto sm:mt-2 sm:max-w-xs sm:rounded-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
            <h2 id={panelId + "-title"} className="text-sm font-semibold text-brand-900">Filters</h2>
            <button type="button" aria-label="Close filters" onClick={() => setDraft(null)}
              className="grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-brand-50 hover:text-brand-900">
              <FiX size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="grid gap-3 p-4">
            {fields.map(({ name, label, options }) => {
              const value = draft?.[name] ?? applied.get(name) ?? "";
              return (
                <label key={name} className="field-label">
                  {label}
                  <select name={name} value={value}
                    className={`input mt-1.5 ${value ? "border-brand-700! bg-brand-50! text-brand-900!" : ""}`}
                    onChange={(event) => setDraft({ ...draft, [name]: event.target.value })}>
                    {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
                  </select>
                </label>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-slate-200 p-3">
            <button type="button" className="btn btn-outline" onClick={clear}>Clear filters</button>
            <button type="submit" className="btn btn-dark">Apply filters</button>
          </div>
        </dialog>
      </fieldset>
      {active.length > 0 && (
        <ul aria-label="Applied filters" className="mt-2.5 flex flex-wrap gap-2">
          {active.map(({ name, label, options }) => (
            <li key={name} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-900">
              <strong>{label}</strong> · {options.find(([value]) => value === applied.get(name))?.[1]}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
