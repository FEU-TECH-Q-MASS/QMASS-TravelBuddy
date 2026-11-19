const TOKEN_KEY = "travelbuddy_token";
export function getToken() { return typeof window === "undefined" ? "" : window.localStorage.getItem(TOKEN_KEY) || ""; }
export function saveToken(token) { window.localStorage.setItem(TOKEN_KEY, token); }
export function clearToken() { window.localStorage.removeItem(TOKEN_KEY); }
export async function api(path, options = {}) {
  const response = await fetch(`/api/v1${path}`, { ...options, headers: { "Content-Type": "application/json", ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}), ...(options.headers || {}) } });
  if (response.status === 204) return null;
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Request failed.");
  return payload;
}
