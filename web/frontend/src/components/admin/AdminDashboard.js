"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { api } from "@/lib/api";

const accountMetrics = [
  { key: "total", label: "Total users" },
  { key: "admins", label: "Administrators" },
  { key: "newAccounts", label: "New accounts in the last 7 days" },
];
const joinDate = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});

export default function AdminDashboard({ name }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    api("/admin/summary", { signal: controller.signal, cache: "no-store" })
      .then((data) => { if (!controller.signal.aborted) setSummary(data); })
      .catch((error) => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [attempt]);

  function retry() {
    setError("");
    setAttempt((previous) => previous + 1);
  }

  return (
    <section className="page-width pt-8 pb-20 sm:pt-12 sm:pb-24">
      <header className="relative isolate grid min-h-54 place-items-center overflow-hidden rounded-3xl bg-brand-900 px-5 py-12 text-center text-white sm:min-h-72 sm:px-10">
        <Image
          src="/images/alpine-lake.jpg"
          alt=""
          fill
          sizes="(min-width: 1200px) 1152px, calc(100vw - 3rem)"
          className="-z-20 object-cover object-[50%_46%]"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-b from-brand-900/25 via-brand-900/70 to-brand-900/35" />
        <div className="min-w-0 max-w-full">
          <h1 className="text-4xl leading-[1.05] tracking-tight sm:text-6xl">
            Admin <span className="serif-accent">dashboard</span>
          </h1>
        </div>
      </header>

      <section className="mt-8" aria-labelledby="account-overview" aria-busy={!summary && !error}>
        <h2 id="account-overview" className="text-xl font-semibold text-brand-900">Account overview</h2>
        {!summary && !error && <p className="notice mt-4" role="status">Loading account overview…</p>}
        {error && (
          <div className="notice mt-4 flex flex-wrap items-center justify-between gap-3">
            <p role="alert">{error}</p>
            <button type="button" className="btn btn-outline" onClick={retry}>Try again</button>
          </div>
        )}
        {summary && (
          <>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3 sm:gap-5">
              {accountMetrics.map(({ key, label }) => (
                <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <dt className="text-sm font-semibold text-slate-600">{label}</dt>
                  <dd className="mt-2 text-4xl font-semibold text-brand-900 tabular-nums">
                    {summary.counts[key].toLocaleString("en-PH")}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 grid items-start gap-5 lg:grid-cols-[1fr_2fr]">
              <AccountStatus counts={summary.counts} />
              <RecentRegistrations registrations={summary.recentRegistrations} />
            </div>
          </>
        )}
      </section>
      {summary?.supportMessages && <SupportOverview counts={summary.supportMessages} />}
    </section>
  );
}

function SupportOverview({ counts }) {
  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="support-overview">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="support-overview" className="text-xl font-semibold text-brand-900">Support messages</h2>
        <Link href="/admin/support-messages" className="text-link">Open inbox <Icon name="arrow" size={16} /></Link>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { key: "open", label: "Open", className: "bg-brand-50" },
          { key: "resolved", label: "Resolved", className: "bg-slate-50" },
          { key: "archived", label: "Archived", className: "bg-slate-50" },
        ].map(({ key, label, className }) => (
          <div key={key} className={`min-w-0 rounded-xl px-3 py-4 sm:px-4 ${className}`}>
            <dt className="text-sm font-semibold text-slate-600">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold text-brand-900 tabular-nums wrap-anywhere">{counts[key].toLocaleString("en-PH")}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function AccountStatus({ counts: { active, inactive } }) {
  const total = active + inactive;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="account-status">
      <h3 id="account-status" className="text-lg font-semibold text-brand-900">Account status</h3>
      <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        {total > 0 && (
          <>
            <span className="bg-brand-700" style={{ flex: active }} />
            <span className="bg-slate-300" style={{ flex: inactive }} />
          </>
        )}
      </div>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="flex items-center gap-2 text-slate-700"><span className="size-2 rounded-full bg-brand-700" />Active</dt>
          <dd className="font-semibold tabular-nums">{active.toLocaleString("en-PH")}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="flex items-center gap-2 text-slate-700"><span className="size-2 rounded-full bg-slate-300" />Inactive</dt>
          <dd className="font-semibold tabular-nums">{inactive.toLocaleString("en-PH")}</dd>
        </div>
      </dl>
    </section>
  );
}

function RecentRegistrations({ registrations }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="recent-registrations">
      <h3 id="recent-registrations" className="text-lg font-semibold text-brand-900">Recent registrations</h3>
      {registrations.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">No registrations yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {registrations.map(({ id, name, role, createdAt }) => (
            <li key={id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
              <span className="w-full font-semibold text-brand-900 wrap-anywhere sm:w-auto sm:flex-1">{name}</span>
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-900">
                {role === "admin" ? "Admin" : "Traveler"}
              </span>
              <time dateTime={createdAt} className="whitespace-nowrap text-slate-600">{joinDate.format(new Date(createdAt))}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
