import { destinationOptions } from "./travelOptions.js";

export const newTripPath = "/trips/new";

export function tripDestinationCode(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const name = value.trim().toLowerCase();
  return destinationOptions.find(([code, label]) =>
    code.toLowerCase() === name ||
    label.toLowerCase() === name ||
    label.toLowerCase().startsWith(name + ",")
  )?.[0] ?? "";
}

export function newTripHref({ destination, draft } = {}) {
  const query = new URLSearchParams();
  const code = tripDestinationCode(destination);
  if (code) query.set("destination", code);
  if (draft) query.set("draft", "1");
  return query.size ? `${newTripPath}?${query}` : newTripPath;
}

export function tripAuthDestination(value) {
  if (typeof value !== "string") return "/dashboard";
  const [path, query] = value.split("?");
  if (path !== newTripPath) return "/dashboard";
  const params = new URLSearchParams(query);
  return newTripHref({ destination: params.get("destination"), draft: params.get("draft") === "1" });
}

export function authHref(path, next) {
  return next === "/dashboard" ? path : `${path}?next=${encodeURIComponent(next)}`;
}
