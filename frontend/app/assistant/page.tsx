"use client";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Box, Button, Container, Grid, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { AuthPanel } from "@/components/AuthPanel";
import { ConversationHistory } from "@/components/ConversationHistory";
import { ProductCard } from "@/components/ProductCard";
import { ShoppingAssistant } from "@/components/ShoppingAssistant";
import { getConversation, getConversations, getProducts } from "@/services/api";
import { createSupabaseClient } from "@/services/supabase";
import { ConversationDetail, ConversationSummary, Product } from "@/types";
import { CommerceLayout } from "@/components/CommerceLayout";

export default function AssistantPage() {
  const [entered, setEntered] = useState(false);
  const [token, setToken] = useState<string>();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
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

  useEffect(() => { if (entered) getProducts(query, token).then(setProducts).catch(() => setProducts([])); }, [entered, query, token]);
  useEffect(() => { if (entered) getConversations(token).then(setConversations).catch(() => setConversations([])); }, [entered, token]);

  async function refreshConversation(id: string) {
    const [detail, history] = await Promise.all([getConversation(id, token), getConversations(token)]);
    setSelectedConversation(detail); setConversations(history);
  }

  if (!entered) return <Box minHeight="100vh" display="grid" sx={{ background: "radial-gradient(circle at 80% 10%, #28214f 0, #090b13 43%)" }}><Container sx={{ display: "grid", alignItems: "center" }}><AuthPanel onDemo={() => setEntered(true)} /></Container></Box>;

  return <CommerceLayout>
    <Container sx={{ py: 6 }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2} mb={4}><Stack spacing={1}><Typography variant="h2" fontSize={{ xs: 36, md: 52 }}>Your intelligent shopping desk</Typography><Typography color="text.secondary">Ask naturally, compare confidently, and see why every product was selected.</Typography></Stack><Button color="inherit" onClick={signOut}>Sign out</Button></Stack>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }}><ConversationHistory conversations={conversations} selectedId={selectedConversation?.conversation.id} onSelect={refreshConversation} onNew={() => setSelectedConversation(undefined)} /></Grid>
        <Grid size={{ xs: 12, md: 9 }}><ShoppingAssistant token={token} selectedConversation={selectedConversation} onConversationChanged={refreshConversation} /></Grid>
      </Grid>
      <Box mt={8}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2} mb={3}>
          <Typography variant="h4" fontWeight={800}>Product catalogue</Typography>
          <TextField size="small" placeholder="Search products" value={query} onChange={(event) => setQuery(event.target.value)} InputProps={{ startAdornment: <SearchRoundedIcon sx={{ mr: 1 }} /> }} />
        </Stack>
        <Grid container spacing={2}>{products.map((product) => <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4 }}><ProductCard product={product} /></Grid>)}</Grid>
      </Box>
    </Container>
  </CommerceLayout>;
}
