const { createClient } = require("@supabase/supabase-js");
const { trips } = require("../store");

const enabled = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
const client = enabled ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } }) : null;

async function saveTrip(trip) {
  trips.set(trip.id, trip);
  if (!client) return trip;
  const { error } = await client.from("travelbuddy_saved_trips").upsert({ id: trip.id, owner_id: trip.ownerId, payload: trip, created_at: trip.createdAt, updated_at: trip.updatedAt }, { onConflict: "id" });
  if (error) throw error;
  return trip;
}

async function listTrips(ownerId) {
  if (!client) return [...trips.values()].filter((trip) => trip.ownerId === ownerId);
  const { data, error } = await client.from("travelbuddy_saved_trips").select("payload").eq("owner_id", ownerId).order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => row.payload);
}

async function getTrip(id, ownerId) {
  if (!client) {
    const trip = trips.get(id);
    return trip?.ownerId === ownerId ? trip : null;
  }
  const { data, error } = await client.from("travelbuddy_saved_trips").select("payload").eq("id", id).eq("owner_id", ownerId).maybeSingle();
  if (error) throw error;
  if (data?.payload) trips.set(id, data.payload);
  return data?.payload || null;
}

async function deleteTrip(id, ownerId) {
  const trip = await getTrip(id, ownerId);
  if (!trip) return false;
  trips.delete(id);
  if (client) {
    const { error } = await client.from("travelbuddy_saved_trips").delete().eq("id", id).eq("owner_id", ownerId);
    if (error) throw error;
  }
  return true;
}

module.exports = { saveTrip, listTrips, getTrip, deleteTrip };
