const { getSupabaseClient } = require("../config/supabase");

function unauthorized(res) {
  return res.status(401).json({
    error: { code: "UNAUTHORIZED", message: "A valid login is required." },
  });
}

function forbidden(res) {
  return res.status(403).json({
    error: { code: "FORBIDDEN", message: "This account cannot access the resource." },
  });
}

function getToken(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

async function loadProfile(client, userId) {
  const { data, error } = await client
    .from("profiles")
    .select("role, is_active")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function createRequireAuth(supabaseClient) {
  return async function requireAuth(req, res, next) {
    const token = getToken(req);
    if (!token) return unauthorized(res);
    try {
      const client = supabaseClient || getSupabaseClient();
      const { data, error } = await client.auth.getUser(token);
      if (error || !data.user) return unauthorized(res);
      const profile = await loadProfile(client, data.user.id);
      if (!profile || profile.is_active === false) return forbidden(res);
      req.user = { id: data.user.id, email: data.user.email };
      return next();
    } catch {
      return unauthorized(res);
    }
  };
}

function createRequireAdmin(supabaseClient) {
  return async function requireAdmin(req, res, next) {
    try {
      const client = supabaseClient || getSupabaseClient();
      const profile = await loadProfile(client, req.user.id);
      if (!profile || profile.is_active === false || profile.role !== "admin") {
        return forbidden(res);
      }
      return next();
    } catch {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Administrator access is required." },
      });
    }
  };
}

const requireAuth = createRequireAuth();
const requireAdmin = createRequireAdmin();

module.exports = {
  createRequireAuth,
  createRequireAdmin,
  requireAuth,
  requireAdmin,
};
