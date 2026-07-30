"use client";

/** Hosts authentication, conversation history, and the full shopping assistant. */

import { Box, Button, Container, Grid, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { AuthPanel } from "@/components/AuthPanel";
import { ConversationHistory } from "@/components/ConversationHistory";
import { ShoppingAssistant } from "@/components/ShoppingAssistant";
import { getConversation, getConversations } from "@/services/api";
import { createSupabaseClient } from "@/services/supabase";
import { ConversationDetail, ConversationSummary } from "@/types";
import { CommerceLayout } from "@/components/CommerceLayout";

export default function AssistantPage() {
  const [entered, setEntered] = useState(false);
  const [token, setToken] = useState<string>();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail>();

  useEffect(() => {
    const supabase = createSupabaseClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token);
      setEntered(Boolean(data.session));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token);
      setEntered(Boolean(session));
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await createSupabaseClient()?.auth.signOut();
    setToken(undefined); setEntered(false); setSelectedConversation(undefined);
  }

  useEffect(() => { if (entered) getConversations(token).then(setConversations).catch(() => setConversations([])); }, [entered, token]);

  async function refreshConversation(id: string) {
    const [detail, history] = await Promise.all([getConversation(id, token), getConversations(token)]);
    setSelectedConversation(detail); setConversations(history);
  }

  if (!entered) return <Box minHeight="100vh" display="grid" sx={{ background: "radial-gradient(circle at 80% 10%, #28214f 0, #090b13 43%)" }}><Container sx={{ display: "grid", alignItems: "center" }}><AuthPanel onDemo={() => setEntered(true)} /></Container></Box>;

  return <CommerceLayout>
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2} mb={4}><Stack spacing={1}><Typography variant="h2" fontSize={{ xs: 36, md: 52 }}>Your intelligent shopping desk</Typography><Typography color="text.secondary">Ask naturally, compare confidently, and see why every product was selected.</Typography></Stack><Button color="inherit" onClick={signOut}>Sign out</Button></Stack>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }}><ConversationHistory conversations={conversations} selectedId={selectedConversation?.conversation.id} onSelect={refreshConversation} onNew={() => setSelectedConversation(undefined)} /></Grid>
        <Grid size={{ xs: 12, md: 9 }}><ShoppingAssistant token={token} selectedConversation={selectedConversation} onConversationChanged={refreshConversation} /></Grid>
      </Grid>
    </Container>
  </CommerceLayout>;
}
