import { getSupabaseClient } from "@/lib/supabaseClient";
import { apiFetch } from "@/lib/apiFetch";

export function getToken() {
  if (typeof window === "undefined") return "";
  const storageKey = Object.keys(window.localStorage).find((key) => key.startsWith("sb-") && key.endsWith("-auth-token"));
  if (!storageKey) return "";
  try { return JSON.parse(window.localStorage.getItem(storageKey))?.access_token || ""; } catch { return ""; }
}

export function saveToken() { /* Supabase manages the session. */ }
export function clearToken() { getSupabaseClient().auth.signOut(); }
export const api = apiFetch;

export function generateSavedItinerary(trip, reason) {
  return api(`/trips/${trip.id}/generate`, {
    method: "POST",
    body: JSON.stringify({ reason, updatedAt: trip.updatedAt }),
  });
}
