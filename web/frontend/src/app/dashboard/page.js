"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import Icon from "@/components/Icon";
import { useSiteAuth } from "@/components/layout/AppShell";
import TripEditForm from "@/components/TripEditForm";
import { resolveTravelLocation } from "@/lib/travelOptions";
import { newTripPath } from "@/lib/tripPlannerNavigation";

const destinationImages = {
  MNL: "manila.jpg", CEB: "cebu.jpg", DGT: "dumaguete.jpg",
  PPS: "palawan-puerto-princesa.jpg", USU: "palawan-coron-lagoon.jpg",
  TAC: "tacloban.jpg", LAO: "laoag.jpg", PAL: "palawan.jpg",
  BOH: "bohol.jpg", BOR: "boracay-shangri-la.jpg", BAN: "banaue.jpg",
};
const TRIPS_PER_PAGE = 6;

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

export default function DashboardPage() {
  const { user, loading, profile, profileLoading, profileError, signingOut, signOut } = useSiteAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && !signingOut.current) router.replace("/login");
  }, [loading, user, router, signingOut]);

  if (loading || profileLoading || (user && !profile)) {
    return (
      <section className="page-width section-space">
        <p className="notice" role={profileError ? "alert" : "status"}>
          {profileLoading ? "Loading dashboard…" : profileError || "Loading dashboard…"}
        </p>
      </section>
    );
  }
  if (!user) return null;
  if (profile.role === "admin") {
    return <AdminDashboard key={user.id} name={profile.display_name} />;
  }
  return <TravelerDashboard key={user.id} user={profile} onLogout={signOut} />;
}

function TravelerDashboard({ user, onLogout }) {
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const tripsHeading = useRef(null);
  const totalPages = Math.max(1, Math.ceil(trips.length / TRIPS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * TRIPS_PER_PAGE;
  const visibleTrips = trips.slice(startIndex, startIndex + TRIPS_PER_PAGE);
  const firstPageButton = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const pageButtons = Array.from({ length: Math.min(5, totalPages) }, (_, index) => firstPageButton + index);
  const paginationDisabled = Boolean(editingId || deletingId);

  function changePage(nextPage) {
    if (paginationDisabled || nextPage === currentPage) return;
    setPage(Math.max(1, Math.min(nextPage, totalPages)));
    setSuccess("");
    tripsHeading.current?.focus({ preventScroll: true });
    tripsHeading.current?.scrollIntoView({ block: "start" });
  }

  useEffect(() => {
    const controller = new AbortController();
    api("/trips", { signal: controller.signal })
      .then(({ trips }) => {
        if (!controller.signal.aborted) setTrips(trips);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  async function deleteTrip(trip) {
    if (!window.confirm(`Permanently delete your trip to ${trip.destination}?`)) return;
    setDeletingId(trip.id);
    setError("");
    setSuccess("");
    try {
      await api(`/trips/${trip.id}`, { method: "DELETE" });
      setTrips((current) => current.filter((item) => item.id !== trip.id));
      setPage((current) => Math.min(current, Math.max(1, Math.ceil((trips.length - 1) / TRIPS_PER_PAGE))));
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="bg-slate-50/80">
    <section className="page-width py-8 sm:py-12">
      <div className="relative isolate overflow-hidden rounded-3xl bg-brand-900">
        <Image src="/images/palawan-el-nido-kayaking.jpg" alt="" fill priority sizes="(max-width: 1200px) 100vw, 1152px" className="object-cover object-center" />
        <div className="absolute inset-0 bg-linear-to-r from-brand-900 via-brand-900/90 to-brand-900/20" />
        <div className="relative max-w-2xl px-6 py-10 sm:px-10 sm:py-14">
          <p className="mb-5 flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-cyan-200 uppercase"><Icon name="compass" size={16} /> Your travel desk</p>
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-white sm:text-5xl">Welcome{user?.display_name ? `, ${user.display_name.split(" ")[0]}` : " back"}.</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/80 sm:text-base">A little planning. A lot to look forward to.<br />Your next Philippine adventure starts here.</p>
          <Link href={newTripPath} className="btn btn-primary mt-7 hover:shadow-sm hover:shadow-black/10"><Icon name="plus" size={18} /> Plan a new trip</Link>
        </div>
      </div>

      <div className="mt-9 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-7">
      <section aria-labelledby="my-trips-title" className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 ref={tripsHeading} id="my-trips-title" tabIndex={-1} className="scroll-mt-28 text-2xl font-semibold tracking-tight text-brand-900">My trips</h2>
              {!loading && <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">{trips.length} saved</span>}
            </div>
            <p className="mt-2 text-sm text-slate-500">Good things ahead. Pick up where you left off.</p>
          </div>
          <Link href="/explore" className="text-link text-xs">Explore destinations <Icon name="arrow" size={14} /></Link>
        </div>
        {error && <p role="alert" className="notice mt-5">{error}</p>}
        {success && (
          <div className="notice mt-5 flex items-start justify-between gap-3">
            <p role="status" className="min-w-0 self-center">{success}</p>
            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss trip update message"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-brand-700 transition-colors hover:bg-cyan-100 hover:text-brand-900"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        )}
        {loading ? (
          <div role="status" className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading your journeys…</div>
        ) : trips.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><Icon name="route" size={25} /></span>
            <h3 className="mt-5 text-xl font-semibold text-brand-900">Your next adventure belongs here.</h3>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">Choose a destination, set your dates, and turn a travel idea into your own itinerary.</p>
            <Link href={newTripPath} className="btn btn-dark mt-6">Plan your first trip <Icon name="arrow" size={16} /></Link>
          </div>
        ) : (
          <>
          <div className="mt-6 grid items-start gap-5 md:grid-cols-2">
            {visibleTrips.map((trip) => (
              <article key={trip.id} className={`group min-w-0 overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${editingId === trip.id ? "border-brand-700 ring-2 ring-brand-700/10" : "border-slate-200"}`}>
                <Link href={`/trips/${trip.id}`} className="relative block h-48 overflow-hidden bg-brand-900">
                  <Image src={`/images/${destinationImages[String(trip.destination).toUpperCase()] || "philippines.jpg"}`} alt="" fill sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 420px" className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
                  <div className="absolute inset-0 bg-linear-to-t from-brand-900/95 via-brand-900/20 to-transparent" />
                  <span className="absolute top-4 left-4 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold tracking-wider text-brand-900 uppercase">Saved journey</span>
                  <div className="absolute inset-x-5 bottom-5 text-white">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] text-white/80"><Icon name="pin" size={12} /> Philippines</p>
                    <h3 className="text-2xl font-semibold tracking-tight">{resolveTravelLocation(trip.destination).replace(/, Philippines$/i, "")}</h3>
                  </div>
                </Link>
                <div className="p-5">
                  <p className="flex items-start gap-2 text-xs leading-5 font-medium text-slate-500"><Icon name="calendar" size={15} className="mt-0.5 shrink-0 text-brand-700" /><span>{formatDate(trip.departure)} – {formatDate(trip.returnDate)}</span></p>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1.5"><Icon name="clock" size={14} className="text-slate-400" />{trip.itinerary.length} {trip.itinerary.length === 1 ? "day" : "days"}</span>
                    <span className="inline-flex items-center gap-1.5"><Icon name="users" size={14} className="text-slate-400" />{trip.travelers} {trip.travelers === 1 ? "traveler" : "travelers"}</span>
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-3">
                    <span className="text-xs text-slate-500">Trip budget</span>
                    <p className="text-base font-semibold text-brand-900"><span className="mr-1 text-[10px] font-semibold text-slate-500">{trip.currency}</span>{Number(trip.budget).toLocaleString()}</p>
                  </div>
                {editingId !== trip.id && <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Link href={`/trips/${trip.id}`} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-900 px-3 py-3 text-xs font-semibold text-white transition-colors hover:bg-brand-700">Open workspace <Icon name="arrow" size={15} /></Link>
                  <button type="button" onClick={() => { setEditingId(trip.id); setSuccess(""); }} disabled={Boolean(deletingId) || Boolean(editingId)} aria-label={`Edit trip to ${trip.destination}`} title="Edit trip" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-brand-700 transition-colors hover:border-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"><Icon name="edit" size={17} /></button>
                  <button type="button" onClick={() => deleteTrip(trip)} disabled={Boolean(deletingId) || Boolean(editingId)} aria-label={deletingId === trip.id ? "Deleting trip" : `Permanently delete trip to ${trip.destination}`} title="Delete permanently" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"><Icon name={deletingId === trip.id ? "clock" : "trash"} size={17} /></button>
                </div>}
                {editingId === trip.id && <TripEditForm trip={trip} onCancel={() => setEditingId("")} onSave={(updated) => {
                  setTrips((current) => current.map((item) => item.id === updated.id ? updated : item));
                  setEditingId("");
                  setSuccess("Trip updated. Your itinerary preview and estimates have been rebuilt.");
                }} />}
                </div>
              </article>
            ))}
          </div>
          {totalPages > 1 && (
            <nav aria-label="My trips pagination" className="mt-7 flex flex-col items-center gap-3 border-t border-slate-200 pt-5">
              <p role="status" className="text-xs text-slate-500">Showing {startIndex + 1}–{Math.min(startIndex + TRIPS_PER_PAGE, trips.length)} of {trips.length} trips <span className="sr-only">· Page {currentPage} of {totalPages}</span></p>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <button type="button" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1 || paginationDisabled} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-brand-900 transition-colors hover:border-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"><Icon name="chevron" size={14} className="rotate-180" /> Previous</button>
                {firstPageButton > 1 && <span aria-hidden="true" className="px-1 text-xs text-slate-400">…</span>}
                {pageButtons.map((value) => (
                  <button key={value} type="button" onClick={() => changePage(value)} aria-label={`Page ${value}`} aria-current={value === currentPage ? "page" : undefined} disabled={paginationDisabled} className={`inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${value === currentPage ? "border-brand-900 bg-brand-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand-700 hover:bg-brand-50"}`}>{value}</button>
                ))}
                {pageButtons.at(-1) < totalPages && <span aria-hidden="true" className="px-1 text-xs text-slate-400">…</span>}
                <button type="button" onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages || paginationDisabled} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-brand-900 transition-colors hover:border-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40">Next <Icon name="chevron" size={14} /></button>
              </div>
            </nav>
          )}
          </>
        )}
      </section>

      <aside aria-label="Travel tools" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">Make it your own</p>
          <h2 className="mt-2 text-lg font-semibold text-brand-900">Your travel essentials</h2>
          <div className="mt-4 space-y-1">
            <DashboardShortcut href="/account" icon="settings" title="Preferences" description="Profile, currency & interests" />
            <DashboardShortcut href="/notifications" icon="bell" title="Notifications" description="Your latest travel updates" />
          </div>
          <button type="button" onClick={onLogout} className="mt-4 w-full border-t border-slate-100 pt-4 text-left text-xs font-medium text-slate-500 transition-colors hover:text-brand-700">Log out of your account <span aria-hidden="true">↗</span></button>
        </div>
        <div className="rounded-2xl border border-cyan-100 bg-[#eaf6f7] p-6">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-700"><Icon name="sun" size={21} /></span>
          <h2 className="mt-4 text-lg font-semibold text-brand-900">Leave room for discovery.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">A quiet beach, a local café, a different way home. The best trips have a little breathing room.</p>
          <Link href="/explore" className="text-link mt-5 text-xs">Find your next stop <Icon name="arrow" size={14} /></Link>
        </div>
      </aside>
      </div>
    </section>
    </div>
  );
}

function DashboardShortcut({ href, icon, title, description }) {
  return (
    <Link href={href} className="group/shortcut -mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-slate-50">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-brand-700 group-hover/shortcut:bg-brand-50"><Icon name={icon} size={17} /></span>
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-brand-900">{title}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{description}</p></div>
      <Icon name="chevron" size={14} className="shrink-0 text-slate-400" />
    </Link>
  );
}
