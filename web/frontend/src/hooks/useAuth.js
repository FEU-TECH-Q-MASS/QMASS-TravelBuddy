"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let subscription;
    try {
      const supabase = getSupabaseClient();
      ({ data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (mounted) {
          setSession(nextSession);
          setLoading(false);
        }
      }));
    } catch {
      // Supabase is optional until frontend env values are provided.
      queueMicrotask(() => { if (mounted) setLoading(false); });
    }
    return () => { mounted = false; subscription?.unsubscribe(); };
  }, []);

  async function logout() { await getSupabaseClient().auth.signOut(); }
  return { user: session?.user || null, session, loading, logout };
}
