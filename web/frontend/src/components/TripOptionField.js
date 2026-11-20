import { useEffect, useRef, useState } from "react";

const visibleOptions = 10;

function getPlacement(field, header) {
  const bounds = field.getBoundingClientRect();
  const headerBottom = Math.max(0, header?.getBoundingClientRect().bottom ?? 0);
  const below = window.innerHeight - bounds.bottom;
  const above = bounds.top - headerBottom;
  const openAbove = below < 410 && above > below;
  return {
    above: openAbove,
    space: Math.max(0, (openAbove ? above : below) - 16),
    visible: bounds.bottom > headerBottom && bounds.top < window.innerHeight,
  };
}

export default function TripOptionField({ id, label, placeholder, options, value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const [placement, setPlacement] = useState({ above: false, space: 400 });
  const field = useRef(null);
  const input = useRef(null);
  const list = useRef(null);
  const selected = options.find(([code]) => code === value);
  const terms = query.toLowerCase().trim().split(/\s+/);
  const matches = options.filter((option) => {
    const text = option.join(" ").toLowerCase();
    return terms.every((term) => text.includes(term));
  });
  const activeIndex = Math.min(active, matches.length - 1);
  const listId = `${id}-options`;

  useEffect(() => {
    if (!open) return;
    const header = document.querySelector(".site-header");
    function dismiss(event) {
      if (!field.current?.contains(event.target)) setOpen(false);
    }
    function reposition() {
      const next = getPlacement(field.current, header);
      if (next.visible) setPlacement(next);
      else setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    window.addEventListener("scroll", reposition, { passive: true });
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("scroll", reposition);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const viewport = list.current;
    const row = viewport.children[activeIndex];
    if (!row) return;
    if (row.offsetTop < viewport.scrollTop) {
      viewport.scrollTop = row.offsetTop;
    } else if (row.offsetTop + row.offsetHeight > viewport.scrollTop + viewport.clientHeight) {
      viewport.scrollTop = row.offsetTop + row.offsetHeight - viewport.clientHeight;
    }
  }, [activeIndex, query, open]);

  function show(index = Math.max(options.findIndex(([code]) => code === value), 0)) {
    setPlacement(getPlacement(field.current, document.querySelector(".site-header")));
    setQuery("");
    setActive(index);
    setOpen(true);
  }

  function choose(index) {
    if (!matches[index]) return;
    onChange(matches[index][0]);
    setOpen(false);
  }

  function handleKey(event) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : -1;
        if (open) setActive(Math.max(0, Math.min(matches.length - 1, activeIndex + direction)));
        else if (selected || direction > 0) show();
        else show(options.length - 1);
        break;
      }
      case "Enter":
        if (open) {
          event.preventDefault();
          choose(activeIndex);
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        break;
    }
  }

  return (
    <div className="relative min-w-0" ref={field}>
      <label id={`${id}-label`} htmlFor={id} className="field-label">{label}</label>
      <div className="relative mt-2">
        <input ref={input} id={id} type="text" role="combobox" autoComplete="off" aria-autocomplete="list"
          aria-expanded={open} aria-controls={open ? listId : undefined} aria-required="true"
          aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
          aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          className="input pr-10" value={open ? query : selected?.[1] || ""}
          placeholder={open ? "Search by name or airport code" : placeholder}
          onFocus={(event) => { if (!open) event.target.select(); }}
          onClick={() => { if (!open) show(); }} onBlur={() => setOpen(false)} onKeyDown={handleKey}
          onChange={(event) => {
            event.stopPropagation();
            if (!open) show(0);
            setQuery(event.target.value);
            setActive(0);
          }} />
        <button type="button" tabIndex={-1} aria-label={`${open ? "Hide" : "Show"} ${label.toLowerCase()} options`}
          className="absolute inset-y-0 right-0 grid w-10 place-items-center" onMouseDown={(event) => event.preventDefault()}
          onClick={() => { input.current.focus(); if (open) setOpen(false); else show(); }}>
          <span aria-hidden="true" className="size-2 -translate-y-0.5 rotate-45 border-r border-b border-slate-500" />
        </button>
      </div>
      {open && (
        <div className={`absolute inset-x-0 z-20 rounded-xl border border-slate-200 bg-white p-1 shadow-lg ${placement.above ? "bottom-full mb-1" : "top-full mt-1"}`}>
          <ul id={listId} ref={list} role="listbox" aria-labelledby={`${id}-label`}
            className="relative overflow-y-auto overscroll-contain"
            style={{ maxHeight: `min(${visibleOptions * 2.5}rem, ${placement.space}px)` }}>
            {matches.map(([code, name], index) => (
              <li id={`${listId}-${index}`} key={code} role="option" aria-selected={code === value}
                className={`flex h-10 cursor-pointer items-center rounded-lg px-2 text-sm leading-4 hover:bg-brand-50 ${index === activeIndex ? "bg-brand-50 text-brand-900" : "text-slate-700"} ${code === value ? "font-semibold" : ""}`}
                onMouseDown={(event) => event.preventDefault()} onClick={() => choose(index)}>
                <span className="line-clamp-2" title={name}>{name}</span>
              </li>
            ))}
          </ul>
          {!matches.length && <p role="status" className="px-2 py-3 text-sm text-slate-600">No matching options.</p>}
        </div>
      )}
      {error && <span id={`${id}-error`} className="mt-2 block text-xs text-red-700">{error}</span>}
    </div>
  );
}
