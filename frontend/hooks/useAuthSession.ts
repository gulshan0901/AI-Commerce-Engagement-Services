"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createSupabaseClient } from "@/services/supabase";

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const supabase = createSupabaseClient();
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(async ({ data }) => {
      const expiresSoon = data.session?.expires_at && data.session.expires_at * 1000 < Date.now() + 30_000;
      if (expiresSoon) {
        const refreshed = await supabase.auth.refreshSession();
        setSession(refreshed.data.session);
      } else setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setLoading(false); });
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, loading };
}
