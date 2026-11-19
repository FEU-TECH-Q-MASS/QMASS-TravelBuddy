const { sessions, users } = require("../store");
const supabaseAuth = require("../services/supabase-auth.service");
async function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (supabaseAuth.isEnabled()) {
    try { req.user = await supabaseAuth.getUser(token); return next(); } catch { return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "A valid login is required." } }); }
  }
  const userId = sessions.get(token);
  const user = userId && users.get(userId);
  if (!user || !user.active) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Sign in is required." } });
  req.user = user;
  next();
}
function requireAdmin(req, res, next) { if (req.user.role !== "admin") return res.status(403).json({ error: { code: "FORBIDDEN", message: "Administrator access is required." } }); next(); }
module.exports = { requireAuth, requireAdmin };
