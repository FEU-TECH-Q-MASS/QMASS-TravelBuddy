"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useSiteAuth } from "@/components/layout/AppShell";
import { api } from "@/lib/api";

const joinDate = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});

export default function AdminUsersPage() {
  const { user, loading, profile, profileLoading, profileError } = useSiteAuth();

  return (
    <section className="page-width section-space">
      <h1 className="page-title">Manage users</h1>
      <p className="mt-3 text-slate-600">Find accounts, assign roles, and manage access.</p>
      {(loading || profileLoading) && <p className="notice mt-8" role="status">Loading users…</p>}
      {!loading && !user && (
        <p className="notice mt-8"><Link href="/login" className="text-link">Sign in</Link> to manage users.</p>
      )}
      {user && !profileLoading && profile?.role !== "admin" && (
        <p className="notice mt-8" role="alert">{profileError || "Administrator access is required."}</p>
      )}
      {user && !profileLoading && profile?.role === "admin" && (
        <Suspense fallback={<p className="notice mt-8" role="status">Loading users…</p>}>
          <DirectoryFilters key={user.id} currentUserId={user.id} />
        </Suspense>
      )}
    </section>
  );
}

function DirectoryFilters({ currentUserId }) {
  const params = useSearchParams();
  const search = (params.get("search") ?? "").trim().slice(0, 254);
  const role = params.get("role");
  const status = params.get("status");
  const filterQuery = new URLSearchParams();
  if (search) filterQuery.set("search", search);
  if (role === "admin" || role === "traveler") filterQuery.set("role", role);
  if (status === "active" || status === "inactive") filterQuery.set("status", status);
  const filters = filterQuery.toString();

  return <UserDirectory key={filters} currentUserId={currentUserId} filters={filters} />;
}

function UserDirectory({ currentUserId, filters }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [updateError, setUpdateError] = useState("");
  const [updateNotice, setUpdateNotice] = useState("");
  const current = result?.page === page && result?.refresh === refresh ? result : null;
  const users = current?.users ?? [];
  const applied = new URLSearchParams(filters);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams(filters);
    query.set("page", String(page));
    api(`/admin/users?${query}`, { signal: controller.signal, cache: "no-store" })
      .then(({ users, hasNextPage }) => {
        if (!controller.signal.aborted) setResult({ page, refresh, users, hasNextPage });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setResult({ page, refresh, error: error.message });
      });
    return () => controller.abort();
  }, [filters, page, refresh]);

  function applyFilters(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const query = new URLSearchParams();
    for (const key of ["search", "role", "status"]) {
      const value = data.get(key).trim();
      if (value) query.set(key, value);
    }
    setPage(1);
    setUpdateError("");
    setUpdateNotice("");
    router.push(query.size ? `/admin/users?${query}` : "/admin/users");
  }

  function changePage(nextPage) {
    setUpdateError("");
    setUpdateNotice("");
    setPage(nextPage);
  }

  async function update(id, changes) {
    setPendingId(id);
    setUpdateError("");
    setUpdateNotice("");
    try {
      const { user } = await api(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      });
      setUpdateNotice(`Updated ${user.name}.`);
      setRefresh((previous) => previous + 1);
    } catch (error) {
      setUpdateError(error.message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mt-8">
      <form onSubmit={applyFilters} className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <label className="field-label min-w-52 flex-1">
          Search users
          <input name="search" type="search" maxLength={254} placeholder="Name or email" defaultValue={applied.get("search") ?? ""} className="input mt-2" />
        </label>
        <label className="field-label w-36 grow sm:grow-0">
          Role
          <select name="role" defaultValue={applied.get("role") ?? ""} className="input mt-2">
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="traveler">Traveler</option>
          </select>
        </label>
        <label className="field-label w-36 grow sm:grow-0">
          Status
          <select name="status" defaultValue={applied.get("status") ?? ""} className="input mt-2">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <button type="submit" className="btn btn-dark disabled:opacity-50" disabled={pendingId !== null}>Apply filters</button>
        {filters && <Link href="/admin/users" className="btn btn-outline">Clear filters</Link>}
      </form>

      {updateError && <p className="notice mb-4" role="alert">{updateError}</p>}
      {updateNotice && <p className="notice mb-4" role="status">{updateNotice}</p>}
      {!current && <p className="notice" role="status">Loading users…</p>}
      {current?.error && <p className="notice" role="alert">{current.error}</p>}
      {current && !current.error && users.length === 0 && (
        <p className="notice">{filters ? "No users match these filters on this page." : "No user profiles on this page."}</p>
      )}
      {users.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-2xl text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="p-4">Account</th>
                <th scope="col" className="p-4">Role</th>
                <th scope="col" className="p-4">Status</th>
                <th scope="col" className="p-4">Joined</th>
                <th scope="col" className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <th scope="row" className="p-4">
                    <span className="block font-semibold text-brand-900">{user.name}</span>
                    <span className="mt-1 block font-normal text-slate-600">{user.email ?? "—"}</span>
                  </th>
                  <td className="p-4">
                    {user.id === currentUserId ? "Admin" : (
                      <select
                        aria-label={`Role for ${user.email ?? user.name}`}
                        className="rounded-lg border border-slate-200 px-3 py-2"
                        value={user.role}
                        disabled={pendingId !== null}
                        onChange={(event) => update(user.id, { role: event.target.value })}
                      >
                        <option value="traveler">Traveler</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                      {user.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap p-4 text-slate-600">
                    {user.createdAt ? <time dateTime={user.createdAt}>{joinDate.format(new Date(user.createdAt))}</time> : "—"}
                  </td>
                  <td className="p-4">
                    {user.id === currentUserId ? "Your account" : (
                      <button
                        type="button"
                        className="text-link disabled:opacity-50"
                        disabled={pendingId !== null}
                        onClick={() => update(user.id, { active: !user.active })}
                      >
                        {pendingId === user.id ? "Saving…" : user.active ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {current && !current.error && (
          <p className="text-sm text-slate-600" role="status">{users.length} {users.length === 1 ? "user" : "users"} on this page</p>
        )}
        {(page > 1 || current?.hasNextPage) && (
          <nav aria-label="User pages" className="ml-auto flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-outline disabled:opacity-50" disabled={page === 1 || pendingId !== null} onClick={() => changePage(page - 1)}>Previous</button>
            <span className="text-sm">Page {page}</span>
            <button type="button" className="btn btn-outline disabled:opacity-50" disabled={!current?.hasNextPage || pendingId !== null} onClick={() => changePage(page + 1)}>Next</button>
          </nav>
        )}
      </div>
    </div>
  );
}
