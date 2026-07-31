"use client";

/** Hosts guest conversation history and the full shopping assistant. */

import { Container, Grid, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { ConversationHistory } from "@/components/ConversationHistory";
import { ShoppingAssistant } from "@/components/ShoppingAssistant";
import { getConversation, getConversations } from "@/services/api";
import { ConversationDetail, ConversationSummary } from "@/types";
import { CommerceLayout } from "@/components/CommerceLayout";

export default function AssistantPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail>();

  useEffect(() => { getConversations().then(setConversations).catch(() => setConversations([])); }, []);

  async function refreshConversation(id: string) {
    const [detail, history] = await Promise.all([getConversation(id), getConversations()]);
    setSelectedConversation(detail); setConversations(history);
  }

  return <CommerceLayout>
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Stack spacing={1} mb={4}><Typography variant="h2" fontSize={{ xs: 36, md: 52 }}>Your intelligent shopping desk</Typography><Typography color="text.secondary">Ask naturally, compare confidently, and see why every product was selected. No account required.</Typography></Stack>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }}><ConversationHistory conversations={conversations} selectedId={selectedConversation?.conversation.id} onSelect={refreshConversation} onNew={() => setSelectedConversation(undefined)} /></Grid>
        <Grid size={{ xs: 12, md: 9 }}><ShoppingAssistant selectedConversation={selectedConversation} onConversationChanged={refreshConversation} /></Grid>
      </Grid>
    </Container>
  </CommerceLayout>;
}
