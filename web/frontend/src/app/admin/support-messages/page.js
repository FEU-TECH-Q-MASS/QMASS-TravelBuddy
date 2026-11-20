"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [action, setAction] = useState("");
  const [notice, setNotice] = useState(null);
  const updating = useRef(false);

  const query = new URLSearchParams(filters);
  query.set("view", view);
  query.set("page", String(page));
  const path = "/admin/support-messages?" + query.toString();
  const current = result?.path === path && result.revision === revision ? result : null;
  const messages = current?.messages || [];
  const selected = messages.find((message) => message.id === selectedId) || messages[0];

  useEffect(() => {
    const controller = new AbortController();
    api(path, { cache: "no-store", signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));
        if (page > lastPage) setPage(lastPage);
        else setResult({ path, revision, ...data });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setResult({ path, revision, error: error.message });
      });
    return () => controller.abort();
  }, [path, page, revision]);

  function changeView(nextView) {
    setView(nextView);
    setPage(1);
    setSelectedId(null);
    setNotice(null);
  }

  function applyFilters(event) {
    event.preventDefault();
    const next = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (value.trim()) next.set(key, value.trim());
    }
    setFilters(next.toString());
    setPage(1);
    setSelectedId(null);
    setNotice(null);
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Message views" className="inline-flex gap-1 rounded-xl bg-slate-100 p-1">
          {[["inbox", "Inbox"], ["archived", "Archived"]].map(([key, label]) => (
            <button key={key} type="button" aria-pressed={view === key} disabled={Boolean(action)}
              onClick={() => changeView(key)}
              className={"rounded-lg px-4 py-2 text-sm font-semibold " + (view === key ? "bg-white text-brand-900 shadow-sm" : "text-slate-600")}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-outline" disabled={Boolean(action)}
          onClick={() => setRevision((value) => value + 1)}>Refresh</button>
      </div>

      <form onSubmit={applyFilters} onReset={() => {
        setFilters("");
        setPage(1);
        setSelectedId(null);
        setNotice(null);
      }}>
        <fieldset disabled={Boolean(action)} className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="field-label min-w-48 flex-1">
            Search by name or email
            <input name="search" type="search" maxLength={254} className="input mt-2" />
          </label>
          <label className="field-label">
            Topic
            <select name="topic" className="input mt-2">
              <option value="">All topics</option>
              {topics.map((topic) => <option key={topic}>{topic}</option>)}
            </select>
          </label>
          <label className="field-label">
            Status
            <select name="status" className="input mt-2">
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
          <button type="submit" className="btn btn-dark">Apply filters</button>
          <button type="reset" className="btn btn-outline">Clear</button>
        </fieldset>
      </form>

      {notice && <p className="notice" role={notice.error ? "alert" : "status"}>{notice.text}</p>}
      {!current && <p className="notice" role="status">Loading messages…</p>}
      {current?.error && <p className="notice" role="alert">{current.error}</p>}
      {current && !current.error && !messages.length && (
        <p className="notice">{filters ? "No messages match these filters." : view === "archived" ? "No archived messages." : "The inbox is empty."}</p>
      )}

      {selected && (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <ul aria-label="Support messages" className="max-h-96 divide-y divide-slate-200 overflow-y-auto rounded-2xl border border-slate-200 lg:max-h-[40rem]">
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
              {view === "archived" ? (
                <button type="button" className="btn btn-dark" disabled={Boolean(action)} onClick={() => updateMessage("restore")}>Restore to inbox</button>
              ) : (
                <>
                  {!selected.resolved_at && <button type="button" className="btn btn-dark" disabled={Boolean(action)} onClick={() => updateMessage("resolve")}>Mark resolved</button>}
                  <button type="button" className="btn btn-outline" disabled={Boolean(action)} onClick={() => updateMessage("archive")}>Archive</button>
                </>
              )}
              {action && <span role="status" className="self-center text-sm text-slate-600">Saving…</span>}
            </div>
          </article>
        </div>
      )}
      {current?.total > current?.pageSize && (
        <nav aria-label="Support message pages" className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-slate-600">Page {page} of {Math.ceil(current.total / current.pageSize)} · {current.total} messages</span>
          <div className="flex gap-2">
            <button type="button" className="btn btn-outline disabled:opacity-60" disabled={page === 1 || Boolean(action)}
              onClick={() => { setSelectedId(null); setPage(page - 1); }}>Previous</button>
            <button type="button" className="btn btn-outline disabled:opacity-60" disabled={page * current.pageSize >= current.total || Boolean(action)}
              onClick={() => { setSelectedId(null); setPage(page + 1); }}>Next</button>
          </div>
        </nav>
      )}
    </div>
  );
}
