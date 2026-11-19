const { createClient } = require("@supabase/supabase-js");

let serverClient;

function getSupabaseClient() {
  if (serverClient) return serverClient;
  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error("Supabase server configuration is missing.");
  }
  serverClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return serverClient;
}

module.exports = { getSupabaseClient };
