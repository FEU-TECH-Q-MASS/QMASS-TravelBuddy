import { createClient } from "@supabase/supabase-js";

let supabaseClient;

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error("Supabase authentication is not configured.");
  supabaseClient = createClient(url, publishableKey);
  return supabaseClient;
}
