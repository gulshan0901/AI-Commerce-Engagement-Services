"use client";

/** Hosts guest conversation history and the full shopping assistant. */

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { Box, Chip, Container, Grid, Paper, Stack, Typography } from "@mui/material";
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
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      <Paper sx={{ mb: 3, p: { xs: 2.5, md: 4 }, overflow: "hidden", position: "relative", background: "linear-gradient(120deg, rgba(124,108,255,.24), rgba(20,24,38,.94) 52%, rgba(77,226,197,.14))" }}>
        <Box sx={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", bgcolor: "rgba(77,226,197,.08)", filter: "blur(8px)", right: -70, top: -100 }} />
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2} position="relative">
          <Box><Chip icon={<AutoAwesomeRoundedIcon />} label="Powered by OpenAI" color="secondary" size="small" sx={{ mb: 1.5 }} /><Typography variant="h2" fontSize={{ xs: 34, md: 50 }}>Shop smarter with Emma</Typography><Typography color="text.secondary" mt={1} maxWidth={700}>Describe what you need, speak naturally, or upload a photo. Emma searches real catalogue products and explains every recommendation.</Typography></Box>
          <Stack direction="row" gap={1} flexWrap="wrap" alignContent="flex-end">{["Text", "Voice", "Visual search", "No login"].map((item) => <Chip key={item} label={item} variant="outlined" />)}</Stack>
        </Stack>
      </Paper>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }}><ConversationHistory conversations={conversations} selectedId={selectedConversation?.conversation.id} onSelect={refreshConversation} onNew={() => setSelectedConversation(undefined)} /></Grid>
        <Grid size={{ xs: 12, md: 9 }}><ShoppingAssistant selectedConversation={selectedConversation} onConversationChanged={refreshConversation} /></Grid>
      </Grid>
    </Container>
  </CommerceLayout>;
}
