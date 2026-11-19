const { createClient } = require("@supabase/supabase-js");

const enabled = !process.argv.includes("--test") && Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
const client = enabled ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } }) : null;

function isEnabled() { return Boolean(client); }

function normalizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.user_metadata?.name || user.email?.split("@")[0] || "Traveler",
    email: user.email,
    role: user.user_metadata?.role === "admin" ? "admin" : "traveler",
    active: !user.banned_until,
    preferences: user.user_metadata?.preferences || { currency: "PHP", interests: [] },
    createdAt: user.created_at,
    supabaseUser: user,
  };
}

async function register({ name, email, password }) {
  const { data, error } = await client.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name, role: "traveler", preferences: { currency: "PHP", interests: [] } } });
  if (error) throw error;
  return signIn({ email, password, fallbackUser: data.user });
}

async function signIn({ email, password, fallbackUser }) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { token: data.session?.access_token, user: normalizeUser(data.user || fallbackUser) };
}

async function getUser(token) {
  const { data, error } = await client.auth.getUser(token);
  if (error) throw error;
  return normalizeUser(data.user);
}

async function updateUser(user, changes) {
  const { data, error } = await client.auth.admin.updateUserById(user.id, { user_metadata: { ...user.supabaseUser?.user_metadata, ...changes } });
  if (error) throw error;
  return normalizeUser(data.user);
}

module.exports = { isEnabled, normalizeUser, register, signIn, getUser, updateUser };
