import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const controlClass = "inline-grid h-9 min-w-9 place-items-center rounded-full border px-1.5 text-sm font-semibold tabular-nums transition-colors disabled:opacity-40";

export default function AdminPagination({ label, page, lastPage, summary, disabled, onChange, children }) {
  const pages = lastPage <= 5
    ? Array.from({ length: lastPage }, (_, index) => index + 1)
    : [...new Set([1, page - 1, page, page + 1, lastPage])]
      .filter((number) => number >= 1 && number <= lastPage)
      .sort((left, right) => left - right);
  const arrowClass = controlClass + " border-brand-700 bg-brand-700 text-white enabled:hover:bg-brand-900";

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 bg-white px-3 py-3 sm:px-4">
      {lastPage > 1 && (
        <nav aria-label={label} className="flex flex-wrap items-center gap-1">
          <button type="button" className={arrowClass} aria-label="Previous page"
            disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>
            <FiChevronLeft aria-hidden="true" size={18} />
          </button>
          {pages.map((number, index) => (
            <span key={number} className="inline-flex items-center gap-1">
              {number - pages[index - 1] > 1 && <span aria-hidden="true" className="px-0.5 text-slate-500">…</span>}
              <button
                type="button"
                aria-label={`Page ${number}`}
                aria-current={number === page ? "page" : undefined}
                disabled={disabled && number !== page}
                onClick={() => { if (number !== page) onChange(number); }}
                className={controlClass + (number === page
                  ? " border-brand-700 bg-brand-700 text-white"
                  : " border-slate-200 bg-white text-slate-700 enabled:hover:border-brand-700 enabled:hover:text-brand-700")}
              >
                {number}
              </button>
            </span>
          ))}
          <button type="button" className={arrowClass} aria-label="Next page"
            disabled={disabled || page >= lastPage} onClick={() => onChange(page + 1)}>
            <FiChevronRight aria-hidden="true" size={18} />
          </button>
        </nav>
      )}
      <div className="ml-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
        <p className="text-sm text-slate-600 tabular-nums" role="status">{summary}</p>
        {children}
      </div>
    </div>
  );
}
