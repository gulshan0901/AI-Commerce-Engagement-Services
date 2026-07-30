"use client";

import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import { Alert, Box, Button, CircularProgress, Grid, Paper, Rating, Stack, TextField, Typography } from "@mui/material";
import { FormEvent, useEffect, useState } from "react";
import { sendChat, submitFeedback } from "@/services/api";
import { ChatResponse, ConversationDetail } from "@/types";
import { ProductCard } from "./ProductCard";

export function ShoppingAssistant({
  token, selectedConversation, onConversationChanged,
}: {
  token?: string;
  selectedConversation?: ConversationDetail;
  onConversationChanged: (id: string) => void;
}) {
  const [input, setInput] = useState("I need a gaming laptop under $1200");
  const [result, setResult] = useState<ChatResponse>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversationId, setConversationId] = useState<string>();
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    setConversationId(selectedConversation?.conversation.id);
    if (result && result.conversation_id !== selectedConversation?.conversation.id) setResult(undefined);
    // A newly persisted turn reloads this same conversation; keep its recommendation cards visible.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim()) return;
    setLoading(true); setError("");
    try {
      const response = await sendChat(input, conversationId, token);
      setResult(response); setConversationId(response.conversation_id);
      onConversationChanged(response.conversation_id);
    }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to reach the assistant"); }
    finally { setLoading(false); }
  }

  async function rate(value: number | null) {
    if (!value || !conversationId || !token) return;
    try { await submitFeedback(conversationId, value, feedbackComment, token); setFeedbackSent(true); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save feedback"); }
  }

  return <Stack spacing={3}>
    <Paper component="form" onSubmit={submit} sx={{ p: 2, display: "flex", gap: 1.5, background: "linear-gradient(135deg, rgba(124,108,255,.18), rgba(77,226,197,.06))" }}>
      <SmartToyOutlinedIcon color="primary" sx={{ mt: 1.5 }} />
      <TextField fullWidth variant="standard" value={input} onChange={(event) => setInput(event.target.value)} placeholder="What are you shopping for?" InputProps={{ disableUnderline: true }} />
      <Button type="submit" variant="contained" disabled={loading} endIcon={loading ? <CircularProgress size={16} /> : <SendRoundedIcon />}>Ask</Button>
    </Paper>
    {error && <Alert severity="error">{error}. Is the FastAPI server running?</Alert>}
    {selectedConversation && selectedConversation.messages.length > 0 && <Stack spacing={1.25}>
      {selectedConversation.messages.map((message) => <Paper key={message.id} variant="outlined" sx={{ p: 1.5, maxWidth: "85%", alignSelf: message.role === "user" ? "flex-end" : "flex-start", bgcolor: message.role === "user" ? "rgba(124,108,255,.14)" : "background.paper" }}>
        <Typography variant="caption" color={message.role === "user" ? "primary.light" : "secondary.main"}>{message.role === "user" ? "You" : "Assistant"}</Typography>
        <Typography>{message.content}</Typography>
      </Paper>)}
    </Stack>}
    {result && <Box>
      <Typography variant="h5" mb={0.5}>Assistant</Typography>
      <Typography color="text.secondary" mb={1}>{result.answer}</Typography>
      {result.memory_used && <Typography variant="caption" color="secondary.main" display="block" mb={3}>Personalized using your conversation memory</Typography>}
      <Grid container spacing={2}>{result.recommendations.map(({ product, reasons }) => <Grid key={product.id} size={{ xs: 12, md: 4 }}><ProductCard product={product} reasons={reasons} /></Grid>)}</Grid>
      {token && <Paper variant="outlined" sx={{ mt: 3, p: 2 }}><Stack spacing={1}><Typography variant="subtitle2">Rate this response</Typography>{feedbackSent ? <Alert severity="success">Feedback saved. Thank you.</Alert> : <><Rating onChange={(_event, value) => rate(value)} /><TextField size="small" label="Optional feedback" value={feedbackComment} onChange={(event) => setFeedbackComment(event.target.value)} /></>}</Stack></Paper>}
    </Box>}
  </Stack>;
}
