"use client";

import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import { Alert, Box, Button, CircularProgress, Container, Grid, LinearProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { CommerceLayout } from "@/components/CommerceLayout";
import { askSupport } from "@/services/api";
import { SupportResponse } from "@/types";

const topics = [
  { icon: <ReplayRoundedIcon />, title: "Returns & refunds", question: "What is the return window and when will I receive my refund?" },
  { icon: <LocalShippingRoundedIcon />, title: "Shipping & delivery", question: "How long does shipping take?" },
  { icon: <VerifiedUserRoundedIcon />, title: "Order assistance", question: "How do I track an order?" },
];

export default function SupportPage() {
  const [question, setQuestion] = useState("What is the return window?");
  const [result, setResult] = useState<SupportResponse>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(""); try { setResult(await askSupport(question)); } catch (caught) { setError(caught instanceof Error ? caught.message : "Support unavailable"); } finally { setLoading(false); } }

  return <CommerceLayout><Box sx={{ background: "radial-gradient(circle at 15% 20%, rgba(124,108,255,.25), transparent 38%), radial-gradient(circle at 85% 0%, rgba(77,226,197,.14), transparent 32%)" }}><Container maxWidth="lg" sx={{ py: 8 }}><Stack alignItems="center" textAlign="center" mb={5}><SupportAgentRoundedIcon color="secondary" sx={{ fontSize: 52 }} /><Typography variant="h2" mt={1}>How can we help?</Typography><Typography color="text.secondary" fontSize={18} maxWidth={650}>Get fast, policy-grounded answers from ACE or continue to a human specialist when confidence is low.</Typography></Stack>
    <Grid container spacing={2} mb={4}>{topics.map((topic) => <Grid key={topic.title} size={{ xs: 12, md: 4 }}><Paper onClick={() => { setQuestion(topic.question); setResult(undefined); }} sx={{ p: 3, height: "100%", cursor: "pointer", transition: ".2s", "&:hover": { transform: "translateY(-3px)", borderColor: "secondary.main" } }}><Box color="secondary.main">{topic.icon}</Box><Typography variant="h6" fontWeight={850} mt={1}>{topic.title}</Typography><Typography color="text.secondary" variant="body2">Select this topic to ask the support advisor.</Typography></Paper></Grid>)}</Grid>
    <Grid container spacing={3}><Grid size={{ xs: 12, md: 8 }}><Paper component="form" onSubmit={submit} sx={{ p: { xs: 2.5, md: 4 } }}><Typography variant="h4" fontWeight={900}>Ask the support advisor</Typography><Typography color="text.secondary" mb={3}>Answers use the curated ACE policy and FAQ knowledge base.</Typography><Stack spacing={2}><TextField multiline minRows={4} label="Describe what you need help with" value={question} onChange={(event) => setQuestion(event.target.value)} /><Button type="submit" size="large" variant="contained" disabled={loading || question.trim().length < 2} endIcon={loading ? <CircularProgress size={18} /> : <SendRoundedIcon />}>{loading ? "Checking policies…" : "Get an answer"}</Button>{error && <Alert severity="error">{error}</Alert>}{result && <Paper variant="outlined" sx={{ p: 2.5, borderColor: result.escalate ? "warning.main" : "success.main" }}><Stack spacing={1.5}><Typography variant="h6" fontWeight={850}>{result.escalate ? "Human review recommended" : "Grounded answer"}</Typography><Typography color="text.secondary" lineHeight={1.7}>{result.answer}</Typography><Box><Stack direction="row" justifyContent="space-between"><Typography variant="caption">Answer confidence</Typography><Typography variant="caption">{Math.round(result.confidence * 100)}%</Typography></Stack><LinearProgress color={result.escalate ? "warning" : "success"} variant="determinate" value={result.confidence * 100} /></Box>{result.sources.length > 0 && <Typography variant="caption" color="text.secondary">Sources: {result.sources.map((source) => source.question).join(" • ")}</Typography>}</Stack></Paper>}</Stack></Paper></Grid>
      <Grid size={{ xs: 12, md: 4 }}><Stack spacing={2}><Paper sx={{ p: 3 }}><Typography variant="h5" fontWeight={850}>Self-service</Typography><Stack spacing={1.5} mt={2}><Button component={Link} href="/orders" variant="outlined" fullWidth>Track your orders</Button><Button component={Link} href="/faq" variant="outlined" fullWidth>Browse all FAQs</Button></Stack></Paper><Paper sx={{ p: 3, bgcolor: "rgba(77,226,197,.07)" }}><SupportAgentRoundedIcon color="secondary" /><Typography variant="h5" fontWeight={850} mt={1}>Need a person?</Typography><Typography color="text.secondary" my={1.5}>When ACE cannot find a reliable policy answer, it recommends escalation and summarizes the question for human review.</Typography><Button component={Link} href="/contact" variant="contained" color="secondary">Contact support</Button></Paper></Stack></Grid></Grid>
  </Container></Box></CommerceLayout>;
}
