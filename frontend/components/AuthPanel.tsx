"use client";

/** Provides Supabase sign-in, sign-up, and local demo authentication controls. */

import { useState } from "react";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { createSupabaseClient, isSupabaseConfigured } from "@/services/supabase";

export function AuthPanel({ onDemo }: { onDemo: () => void }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function signIn() {
    const supabase = createSupabaseClient();
    if (!supabase) return onDemo();
    const redirectTo = `${window.location.origin}/auth/callback?next=/`;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    setMessage(error ? error.message : "Check your email for a secure sign-in link.");
  }

  return <Stack spacing={2} maxWidth={440}>
    <Typography variant="h1" fontSize={{ xs: 42, md: 64 }}>Shop with clarity.</Typography>
    <Typography color="text.secondary" fontSize={18}>Search, compare, and understand every AI recommendation.</Typography>
    {isSupabaseConfigured && <TextField label="Email address" value={email} onChange={(event) => setEmail(event.target.value)} type="email" />}
    <Button size="large" variant="contained" onClick={signIn} disabled={isSupabaseConfigured && !email}>
      {isSupabaseConfigured ? "Send magic link" : "Explore demo"}
    </Button>
    {message && <Alert severity={message.startsWith("Check") ? "success" : "error"}>{message}</Alert>}
    <Typography variant="caption" color="text.secondary">{isSupabaseConfigured ? "Authentication secured by Supabase." : "Demo mode is active. Add Supabase credentials to enable authentication."}</Typography>
  </Stack>;
}
