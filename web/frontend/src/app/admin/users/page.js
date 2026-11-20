"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminPagination from "@/components/admin/AdminPagination";
import { useSiteAuth } from "@/components/layout/AppShell";
import { api } from "@/lib/api";

const joinDate = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});
const userFilters = [
  { name: "role", label: "Role", options: [["", "All roles"], ["admin", "Admin"], ["traveler", "Traveler"]] },
  { name: "status", label: "Status", options: [["", "All statuses"], ["active", "Active"], ["inactive", "Inactive"]] },
];

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
  const lastKnownPage = Math.max(page, result?.lastKnownPage ?? 1);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams(filters);
    query.set("page", String(page));
    api(`/admin/users?${query}`, { signal: controller.signal, cache: "no-store" })
      .then(({ users, hasNextPage }) => {
        if (controller.signal.aborted) return;
        if (filters && page > 1 && !users.length && !hasNextPage) setPage(page - 1);
        else setResult((previous) => ({
          page, refresh, users,
          lastKnownPage: hasNextPage ? Math.max(page + 1, previous?.lastKnownPage ?? 1) : page,
        }));
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setResult((previous) => ({ page, refresh, error: error.message, lastKnownPage: previous?.lastKnownPage }));
        }
      });
    return () => controller.abort();
  }, [filters, page, refresh]);

  function applyFilters(query) {
    setPage(1);
    setUpdateError("");
    setUpdateNotice("");
    if (query !== filters) router.push(query ? `/admin/users?${query}` : "/admin/users");
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
      <div className="mb-5">
        <AdminFilters filters={filters} fields={userFilters} searchLabel="Search users" searchPlaceholder="Name or email"
          disabled={pendingId !== null} onApply={applyFilters} />
      </div>

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
      {(users.length > 0 || lastKnownPage > 1) && (
        <AdminPagination
          label="User pages" page={page} lastPage={lastKnownPage} onChange={changePage}
          disabled={!current || pendingId !== null}
          summary={current?.users && `${users.length} ${users.length === 1 ? "user" : "users"} on this page`}
        />
      )}
    </div>
  );
}
