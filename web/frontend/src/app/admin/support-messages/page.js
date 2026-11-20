"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiMail } from "react-icons/fi";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminPagination from "@/components/admin/AdminPagination";
import { useSiteAuth } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { topics } from "../../../../../contact-validation.cjs";

const dateFormat = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila",
});
const actionMessages = {
  resolve: "Message marked resolved.",
  archive: "Message moved to Archived.",
  restore: "Message restored to the inbox.",
};
const messageFilters = [
  { name: "topic", label: "Topic", options: [["", "All topics"], ...topics.map((topic) => [topic, topic])] },
  { name: "status", label: "Status", options: [["", "All statuses"], ["open", "Open"], ["resolved", "Resolved"]] },
];
const pageSizes = [5, 10, 20];

export default function SupportMessagesPage() {
  const { user, loading, profile, profileLoading, profileError } = useSiteAuth();

  return (
    <section className="page-width section-space">
      <h1 className="page-title">Support messages</h1>
      {(loading || profileLoading) && <p className="notice mt-6" role="status">Checking access…</p>}
      {!loading && !user && <p className="notice mt-6"><Link href="/login" className="text-link">Log in</Link> to view support messages.</p>}
      {user && !profileLoading && profile?.role !== "admin" && (
        <p className="notice mt-6" role="alert">{profileError || "Administrator access is required."}</p>
      )}
      {user && profile?.role === "admin" && !profileLoading && <SupportInbox key={user.id} />}
    </section>
  );
}

function SupportInbox() {
  const [view, setView] = useState("inbox");
  const [filters, setFilters] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [action, setAction] = useState("");
  const [notice, setNotice] = useState(null);
  const updating = useRef(false);

  const query = new URLSearchParams(filters);
  query.set("view", view);
  const collection = query.toString();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  const path = "/admin/support-messages?" + query.toString();
  const current = result?.path === path && result.revision === revision ? result : null;
  const messages = current?.messages || [];
  const selected = messages.find((message) => message.id === selectedId) || messages[0];
  const lastPage = result?.collection === collection && result.total != null
    ? Math.max(page, Math.ceil(result.total / pageSize))
    : page;
  const offset = (page - 1) * pageSize;
  const summary = current?.messages && (messages.length
    ? `${offset + 1}–${offset + messages.length} of ${current.total} ${current.total === 1 ? "message" : "messages"}`
    : "0 messages");

  useEffect(() => {
    const controller = new AbortController();
    api(path, { cache: "no-store", signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));
        if (page > lastPage) {
          setSelectedId(null);
          setPage(lastPage);
        } else setResult({ path, revision, collection, ...data });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setResult((previous) => ({
          ...(previous?.collection === collection ? { total: previous.total } : {}),
          path, revision, collection, error: error.message,
        }));
      });
    return () => controller.abort();
  }, [path, page, revision, collection]);

  function changeView(nextView) {
    setView(nextView);
    setPage(1);
    setSelectedId(null);
    setNotice(null);
  }

  function applyFilters(query) {
    setFilters(query);
    setPage(1);
    setSelectedId(null);
    setNotice(null);
  }

  function changePage(nextPage) {
    setSelectedId(null);
    setPage(nextPage);
  }

  async function updateMessage(nextAction) {
    if (updating.current || !selected) return;
    updating.current = true;
    setAction(nextAction);
    setNotice(null);
    try {
      await api("/admin/support-messages/" + selected.id, {
        method: "PATCH",
        body: JSON.stringify({ action: nextAction }),
      });
      setNotice({ text: actionMessages[nextAction] });
      setRevision((previous) => previous + 1);
    } catch (error) {
      setNotice({ error: true, text: error.message });
    } finally {
      updating.current = false;
      setAction("");
    }
  }

  return (
    <div className="mt-7 space-y-5">
      <AdminFilters key={filters} filters={filters} fields={messageFilters} searchLabel="Search support messages"
        searchPlaceholder="Name or email" disabled={Boolean(action)} onApply={applyFilters}
        leadingControls={
          <div role="group" aria-label="Message views" className="inline-flex shrink-0 gap-1 rounded-xl bg-slate-100 p-1">
            {[["inbox", "Inbox"], ["archived", "Archived"]].map(([key, label]) => (
              <button key={key} type="button" aria-pressed={view === key} onClick={() => changeView(key)}
                className={"h-9 rounded-lg px-2 text-sm font-semibold sm:px-4 " + (view === key ? "bg-white text-brand-900 shadow-sm" : "text-slate-600")}>
                {label}
              </button>
            ))}
          </div>
        }
      />

      {notice && <p className="notice" role={notice.error ? "alert" : "status"}>{notice.text}</p>}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-label="Message list" className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {!current && <p className="p-4 text-sm text-slate-600" role="status">Loading messages…</p>}
          {current?.error && <p className="p-4 text-sm text-slate-700" role="alert">{current.error}</p>}
          {current?.messages && !messages.length && (
            <p className="p-4 text-sm text-slate-600">
              {filters ? "No messages match these filters." : view === "archived" ? "No archived messages." : "The inbox is empty."}
            </p>
          )}
          {messages.length > 0 && (
            <ul key={path} aria-label="Support messages" className="max-h-96 divide-y divide-slate-200 overflow-y-auto lg:max-h-[40rem]">
              {messages.map((message) => (
                <li key={message.id}>
                  <button type="button" aria-pressed={message.id === selected.id} disabled={Boolean(action)}
                    onClick={() => { setSelectedId(message.id); setNotice(null); }}
                    className={"block w-full p-4 text-left " + (message.id === selected.id ? "bg-brand-50" : "bg-white hover:bg-slate-50")}>
                    <span className="block text-xs font-semibold text-brand-700">{message.topic}</span>
                    <span className="mt-1 block font-semibold wrap-anywhere text-brand-900">{message.name}</span>
                    <span className="mt-1 block text-sm text-slate-600">{message.resolved_at ? "Resolved" : "Open"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <AdminPagination label="Support message pages" page={page} lastPage={lastPage} summary={summary}
            disabled={!current || Boolean(action)} onChange={changePage}>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Per page
              <select value={pageSize} disabled={Boolean(action)}
                onChange={(event) => { setPageSize(Number(event.target.value)); changePage(1); }}
                className="rounded-lg border border-slate-200 px-2 py-1.5 font-semibold text-brand-900 disabled:opacity-50">
                {pageSizes.map((size) => <option key={size}>{size}</option>)}
              </select>
            </label>
          </AdminPagination>
        </section>
        {selected && (
          <article aria-label="Selected message" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-brand-900">{selected.topic}</h2>
                <p className="mt-1 wrap-anywhere text-slate-700">{selected.name} · {selected.email}</p>
                <time dateTime={selected.created_at} className="text-sm text-slate-600">{dateFormat.format(new Date(selected.created_at))}</time>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-brand-900">
                {selected.resolved_at ? "Resolved" : "Open"}
              </span>
            </div>
            <p className="mt-5 border-t border-slate-200 pt-5 leading-7 whitespace-pre-wrap wrap-anywhere">{selected.message}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a className="btn btn-dark"
                href={`mailto:${encodeURIComponent(selected.email).replace("%40", "@")}?subject=${encodeURIComponent(`TravelBuddy support · ${selected.topic}`)}`}>
                <FiMail size={16} aria-hidden="true" /> Reply by email
              </a>
              {view === "archived" ? (
                <button type="button" className="btn btn-outline" disabled={Boolean(action)} onClick={() => updateMessage("restore")}>Restore to inbox</button>
              ) : (
                <>
                  {!selected.resolved_at && <button type="button" className="btn btn-outline" disabled={Boolean(action)} onClick={() => updateMessage("resolve")}>Mark resolved</button>}
                  <button type="button" className="btn btn-outline" disabled={Boolean(action)} onClick={() => updateMessage("archive")}>Archive</button>
                </>
              )}
              {action && <span role="status" className="self-center text-sm text-slate-600">Saving…</span>}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
