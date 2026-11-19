const { getSupabaseClient } = require("../config/supabase");

async function getMe(req, res) {
  const { data, error } = await getSupabaseClient()
    .from("profiles")
    .select("display_name, role, is_active")
    .eq("id", req.user.id)
    .maybeSingle();
  if (error || !data || data.is_active === false) {
    return res.status(404).json({
      error: { code: "PROFILE_NOT_FOUND", message: "Profile not found." },
    });
  }
  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      display_name: data.display_name,
      role: data.role,
    },
  });
}

module.exports = { getMe };
