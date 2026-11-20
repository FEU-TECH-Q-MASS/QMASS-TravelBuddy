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
      is_active: data.is_active,
    },
  });
}

async function updateMe(req, res, next) {
  try {
    const displayName = typeof req.body?.display_name === "string"
      ? req.body.display_name.trim()
      : "";
    if (!displayName || displayName.length > 100) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "display_name is required and must be at most 100 characters." },
      });
    }

    const { data, error } = await getSupabaseClient()
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", req.user.id)
      .select("display_name, role, is_active")
      .maybeSingle();
    if (error) throw error;
    if (!data || data.is_active === false) {
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
        is_active: data.is_active,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getMe, updateMe };
