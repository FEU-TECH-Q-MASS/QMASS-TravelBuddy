"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, clearToken, getToken } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [trips, setTrips] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    Promise.all([api("/auth/me"), api("/trips")])
      .then(([me, data]) => {
        setUser(me.user);
        setTrips(data.trips);
      })
      .catch((e) => setError(e.message));
  }, [router]);

  function logout() {
    clearToken();
    router.push("/");
  }

  async function deleteTrip(trip) {
    if (!window.confirm(`Permanently delete your trip to ${trip.destination}?`)) return;
    setDeletingId(trip.id);
    setError("");
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
          <h1 className="page-title">Welcome{user ? `, ${user.name}` : " back"}.</h1>
          <p className="mt-4 text-slate-500">Create, reopen, and refine your saved journeys.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/#plan-trip" className="btn btn-primary">Plan a trip</Link>
          <button onClick={logout} className="btn btn-outline">Log out</button>
        </div>
      </div>

      {error && <p className="notice mt-8">{error}</p>}

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
        {user?.role === "admin" && (
          <Link href="/admin/users" className="rounded-2xl border p-6 hover:border-brand-700">
            <p className="text-xs font-semibold text-brand-700">ADMIN</p>
            <h2 className="mt-2 text-xl font-semibold">Manage users</h2>
            <p className="mt-2 text-sm text-slate-500">Roles and account access.</p>
          </Link>
        )}
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
              <article key={trip.id} className="rounded-2xl border p-6 hover:border-brand-700">
                <Link href={`/trips/${trip.id}`} className="block">
                  <p className="text-xs font-semibold uppercase text-brand-700">{trip.departure} · {trip.returnDate}</p>
                  <h3 className="mt-2 text-xl font-semibold">{trip.destination}</h3>
                  <p className="mt-2 text-sm text-slate-500">{trip.itinerary.length} days · {trip.travelers} travelers · {trip.currency} {trip.budget.toLocaleString()}</p>
                  <p className="mt-4 text-sm font-semibold text-brand-700">Open workspace →</p>
                </Link>
                <button
                  type="button"
                  onClick={() => deleteTrip(trip)}
                  disabled={deletingId === trip.id}
                  className="mt-5 text-sm font-semibold text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === trip.id ? "Deleting…" : "Delete permanently"}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
