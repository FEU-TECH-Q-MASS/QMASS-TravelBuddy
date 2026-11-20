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
  const [placement, setPlacement] = useState({ above: false, space: 400 });
  const field = useRef(null);
  const list = useRef(null);
  const selectedIndex = options.findIndex(([code]) => code === value);
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
    const row = viewport.children[active];
    if (row.offsetTop < viewport.scrollTop) {
      viewport.scrollTop = row.offsetTop;
    } else if (row.offsetTop + row.offsetHeight > viewport.scrollTop + viewport.clientHeight) {
      viewport.scrollTop = row.offsetTop + row.offsetHeight - viewport.clientHeight;
    }
  }, [active, open]);

  function show(index = Math.max(selectedIndex, 0)) {
    setPlacement(getPlacement(field.current, document.querySelector(".site-header")));
    setActive(index);
    setOpen(true);
  }

  function choose(index) {
    onChange(options[index][0]);
    setOpen(false);
  }

  function handleKey(event) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : -1;
        if (open) setActive(Math.min(options.length - 1, Math.max(0, active + direction)));
        else show(selectedIndex >= 0 || direction > 0 ? Math.max(0, selectedIndex) : options.length - 1);
        break;
      }
      case "Home":
      case "End":
        event.preventDefault();
        show(event.key === "Home" ? 0 : options.length - 1);
        break;
      case "Enter":
      case " ":
        if (open) {
          event.preventDefault();
          choose(active);
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
      <button type="button" id={id} role="combobox" aria-expanded={open} aria-controls={open ? listId : undefined}
        aria-labelledby={`${id}-label`} aria-required="true" aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
        aria-activedescendant={open ? `${listId}-${active}` : undefined} className="input mt-2 flex items-center justify-between gap-2 text-left"
        onClick={() => open ? setOpen(false) : show()} onBlur={() => setOpen(false)} onKeyDown={handleKey}>
        <span className="truncate">{options[selectedIndex]?.[1] || placeholder}</span>
        <span aria-hidden="true" className="mr-0.5 size-2 shrink-0 -translate-y-0.5 rotate-45 border-r border-b border-slate-500" />
      </button>
      {open && (
        <div className={`absolute inset-x-0 z-20 rounded-xl border border-slate-200 bg-white p-1 shadow-lg ${placement.above ? "bottom-full mb-1" : "top-full mt-1"}`}>
          <ul id={listId} ref={list} role="listbox" aria-labelledby={`${id}-label`}
            className="relative overflow-y-auto overscroll-contain"
            style={{ maxHeight: `min(${visibleOptions * 2.5}rem, ${placement.space}px)` }}>
            {options.map(([code, name], index) => (
              <li id={`${listId}-${index}`} key={code} role="option" aria-selected={index === selectedIndex}
                className={`flex h-10 cursor-pointer items-center rounded-lg px-2 text-sm leading-4 hover:bg-brand-50 ${index === active ? "bg-brand-50 text-brand-900" : "text-slate-700"} ${index === selectedIndex ? "font-semibold" : ""}`}
                onMouseDown={(event) => event.preventDefault()} onClick={() => choose(index)}>
                <span className="line-clamp-2" title={name}>{name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <span id={`${id}-error`} className="mt-2 block text-xs text-red-700">{error}</span>}
    </div>
  );
}
