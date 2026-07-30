"use client";

import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { Alert, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { FormEvent, useState } from "react";
import { CommerceLayout } from "@/components/CommerceLayout";
import { askSupport } from "@/services/api";
import { SupportResponse } from "@/types";

export default function SupportPage() {
  const [question, setQuestion] = useState("What is the return window?");
  const [result, setResult] = useState<SupportResponse>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    try { setResult(await askSupport(question)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Support unavailable"); }
    finally { setLoading(false); }
  }
  return <CommerceLayout><Container maxWidth="md" sx={{ py: 7 }}><Typography variant="h2" mb={1}>Support advisor</Typography><Typography color="text.secondary" mb={4}>Answers are grounded in the curated ACE policy and FAQ knowledge base.</Typography><Paper component="form" onSubmit={submit} sx={{ p: 3 }}><Stack spacing={2}><TextField multiline minRows={3} label="How can we help?" value={question} onChange={(event) => setQuestion(event.target.value)} /><Button type="submit" variant="contained" disabled={loading || question.trim().length < 2} endIcon={<SendRoundedIcon />}>{loading ? "Checking policies…" : "Ask support"}</Button>{error && <Alert severity="error">{error}</Alert>}{result && <Alert severity={result.escalate ? "warning" : "success"}><Typography>{result.answer}</Typography><Typography variant="caption">Confidence: {Math.round(result.confidence * 100)}%{result.sources.length ? ` · Sources: ${result.sources.map((source) => source.question).join(", ")}` : " · Human review recommended"}</Typography></Alert>}</Stack></Paper></Container></CommerceLayout>;
}
