"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    let subscription;
    try {
      const supabase = getSupabaseClient();
      supabase.auth.getSession().then(({ data }) => {
        if (mounted) { setSession(data.session); setLoading(false); }
      });
      ({ data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (mounted) setSession(nextSession);
      }));
    } catch { /* Supabase is optional until frontend env values are provided. */ }
    return () => { mounted = false; subscription?.unsubscribe(); };
  }, []);

  async function logout() { await getSupabaseClient().auth.signOut(); }
  return { user: session?.user || null, session, loading, logout };
}
