import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

let browserClient;

export function createClient() {
  if (!browserClient) {
    const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();
    browserClient = createBrowserClient(
      supabaseUrl,
      supabasePublishableKey,
    );
  }

  return browserClient;
}
