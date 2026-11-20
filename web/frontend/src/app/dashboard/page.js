"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import Icon from "@/components/Icon";
import { useSiteAuth } from "@/components/layout/AppShell";
import TripEditForm from "@/components/TripEditForm";
import { resolveTravelLocation } from "@/lib/travelOptions";

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

  useEffect(() => {
    const controller = new AbortController();
    api("/trips", { signal: controller.signal })
      .then(({ trips }) => { if (!controller.signal.aborted) setTrips(trips); })
      .catch((error) => { if (!controller.signal.aborted) setError(error.message); });
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
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingId("");
    }
  }

  return (
    <section className="page-width section-space">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Your travel desk</p>
          <h1 className="page-title">Welcome, {user.display_name}.</h1>
          <p className="mt-4 text-slate-500">Create, reopen, and refine your saved journeys.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/#plan-trip" className="btn btn-primary">Plan a trip</Link>
          <button type="button" onClick={onLogout} className="btn btn-outline">Log out</button>
        </div>
      </div>

      {error && <p className="notice mt-8">{error}</p>}
      {success && <p role="status" className="notice mt-8">{success}</p>}

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        <Link href="/account" className="rounded-2xl border p-6 hover:border-brand-700">
          <p className="text-xs font-semibold text-brand-700">ACCOUNT</p>
          <h2 className="mt-2 text-xl font-semibold">Preferences</h2>
          <p className="mt-2 text-sm text-slate-500">Profile, currency, and interests.</p>
        </Link>
        <Link href="/notifications" className="rounded-2xl border p-6 hover:border-brand-700">
          <p className="text-xs font-semibold text-brand-700">ALERTS</p>
          <h2 className="mt-2 text-xl font-semibold">Notifications</h2>
          <p className="mt-2 text-sm text-slate-500">Review travel updates and alerts.</p>
        </Link>
      </div>

      <div className="mt-14">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-brand-900">My trips</h2>
          <span className="text-sm text-slate-500">{trips.length} saved</span>
        </div>
        {trips.length === 0 ? (
          <div className="notice mt-5">No saved trips yet. Start with the planner on the homepage.</div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {trips.map((trip) => (
              <article key={trip.id} className="self-start rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-brand-700">
                <Link href={`/trips/${trip.id}`} className="block">
                  <p className="text-xs font-semibold uppercase text-brand-700">{trip.departure} · {trip.returnDate}</p>
                  <h3 className="mt-2 text-xl font-semibold">{resolveTravelLocation(trip.destination)}</h3>
                  <p className="mt-2 text-sm text-slate-500">{trip.itinerary.length} {trip.itinerary.length === 1 ? "day" : "days"} · {trip.travelers} {trip.travelers === 1 ? "traveler" : "travelers"} · {trip.currency} {trip.budget.toLocaleString()}</p>
                </Link>
                {editingId !== trip.id && <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
                  <Link href={`/trips/${trip.id}`} className="btn btn-dark mr-auto">Open workspace <Icon name="arrow" size={16} /></Link>
                  <button type="button" onClick={() => { setEditingId(trip.id); setSuccess(""); }} disabled={Boolean(deletingId) || Boolean(editingId)} aria-label={`Edit trip to ${trip.destination}`} title="Edit trip" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"><Icon name="edit" size={17} /> Edit</button>
                  <button type="button" onClick={() => deleteTrip(trip)} disabled={Boolean(deletingId) || Boolean(editingId)} aria-label={`Permanently delete trip to ${trip.destination}`} title="Delete permanently" className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"><Icon name="trash" size={18} /><span className="sr-only">{deletingId === trip.id ? "Deleting…" : "Delete permanently"}</span></button>
                </div>}
                {editingId === trip.id && <TripEditForm trip={trip} onCancel={() => setEditingId("")} onSave={(updated) => {
                  setTrips((current) => current.map((item) => item.id === updated.id ? updated : item));
                  setEditingId("");
                  setSuccess("Trip updated. Your itinerary preview and estimates have been rebuilt.");
                }} />}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
