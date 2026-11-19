import { getSupabaseClient } from "@/lib/supabaseClient";

export async function apiFetch(path, options = {}) {
  const { data } = await getSupabaseClient().auth.getSession();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (data.session?.access_token) headers.set("Authorization", `Bearer ${data.session.access_token}`);
  const response = await fetch(`/api/v1${path}`, { ...options, headers });
  if (response.status === 204) return null;
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Request failed.");
  return payload;
}
