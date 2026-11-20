const draftKey = "travelbuddy.trip-preview";

export function saveTripPreview(values) {
  try {
    sessionStorage.setItem(draftKey, JSON.stringify(values));
    return true;
  } catch {
    return false;
  }
}

export function readTripPreview() {
  try {
    const draft = JSON.parse(sessionStorage.getItem(draftKey));
    if (draft && Array.isArray(draft.interests)) return draft;
  } catch {
    // The planner still works without browser storage.
  }
  return null;
}

export function clearTripPreview() {
  try {
    sessionStorage.removeItem(draftKey);
  } catch {
    // A storage failure should not prevent opening the saved trip.
  }
}
