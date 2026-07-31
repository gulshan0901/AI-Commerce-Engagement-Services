"use client";

/** Manages the full-page assistant conversation and recommendation experience. */

import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { Alert, Avatar, Box, Button, Chip, CircularProgress, Grid, IconButton, Paper, Rating, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { sendChat, submitFeedback, visualSearch } from "@/services/api";
import { ChatResponse, ConversationDetail } from "@/types";
import { ProductCard } from "./ProductCard";

type RecognitionResultEvent = { results: ArrayLike<{ 0: { transcript: string } }> };
type Recognition = { lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void; onresult: ((event: RecognitionResultEvent) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };
type RecognitionConstructor = new () => Recognition;

export function ShoppingAssistant({
  token, selectedConversation, onConversationChanged,
}: {
  token?: string;
  selectedConversation?: ConversationDetail;
  onConversationChanged: (id: string) => void;
}) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ChatResponse>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversationId, setConversationId] = useState<string>();
  const [listening, setListening] = useState(false);
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<Recognition | undefined>(undefined);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    setConversationId(selectedConversation?.conversation.id);
    if (result && result.conversation_id !== selectedConversation?.conversation.id) setResult(undefined);
    // A newly persisted turn reloads this same conversation; keep its recommendation cards visible.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation]);

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  async function ask(message: string, voiceReply = false) {
    if (!message.trim()) return;
    setLoading(true); setError("");
    try {
      const response = await sendChat(message, conversationId, token);
      setResult(response); setConversationId(response.conversation_id);
      onConversationChanged(response.conversation_id);
      if (voiceReply) speak(response.answer);
    }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to reach the assistant"); }
    finally { setLoading(false); }
  }

  async function submit(event: FormEvent) { event.preventDefault(); await ask(input); }

  function toggleListening() {
    if (listening) { recognitionRef.current?.stop(); return; }
    const recognitionWindow = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const Constructor = recognitionWindow.SpeechRecognition ?? recognitionWindow.webkitSpeechRecognition;
    if (!Constructor) { setError("Voice input is not supported by this browser."); return; }
    const recognition = new Constructor();
    recognition.lang = "en-US"; recognition.continuous = false; recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      window.setTimeout(() => void ask(transcript, true), 350);
    };
    recognition.onerror = () => { setListening(false); setError("I couldn’t hear that. Please try again."); };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition; setListening(true); setError(""); recognition.start();
  }

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 7_000_000) { setError("Choose a JPG, PNG, or WebP image smaller than 7 MB."); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      setLoading(true); setError("");
      try {
        const visual = await visualSearch(String(reader.result), file.name, token ?? "");
        const recommendations = [...visual.similar, ...visual.cheaper_alternatives.map((item) => ({ ...item, reasons: ["Cheaper alternative", ...item.reasons] })), ...visual.matching_accessories.map((item) => ({ ...item, reasons: ["Matching accessory", ...item.reasons] }))]
          .filter((item, index, items) => items.findIndex((candidate) => candidate.product.id === item.product.id) === index);
        setResult({ conversation_id: conversationId ?? "visual-search", answer: visual.analysis, recommendations, source: visual.source, memory_used: false, intent: "shopping" });
      } catch (caught) { setError(caught instanceof Error ? caught.message : "Visual search is unavailable"); }
      finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  }

  async function rate(value: number | null) {
    if (!value || !conversationId) return;
    try { await submitFeedback(conversationId, value, feedbackComment, token ?? ""); setFeedbackSent(true); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save feedback"); }
  }

  return <Stack spacing={2.5}>
    <Paper sx={{ overflow: "hidden", border: "1px solid rgba(124,108,255,.22)", background: "linear-gradient(145deg, rgba(25,29,46,.98), rgba(14,18,29,.98))" }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: { xs: 2, md: 2.5 }, py: 2, borderBottom: "1px solid rgba(255,255,255,.08)", background: "linear-gradient(90deg, rgba(124,108,255,.18), rgba(77,226,197,.07))" }}><Avatar sx={{ bgcolor: "primary.main" }}><SmartToyOutlinedIcon /></Avatar><Box flexGrow={1}><Typography variant="h6" fontWeight={900}>Emma</Typography><Stack direction="row" spacing={0.75} alignItems="center"><Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "secondary.main" }} /><Typography variant="caption" color="secondary.main">Your AI shopping specialist is online</Typography></Stack></Box><Chip icon={<AutoAwesomeRoundedIcon />} label="Grounded in real products" variant="outlined" sx={{ display: { xs: "none", sm: "flex" } }} /></Stack>
      {!selectedConversation?.messages.length && !result && <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 }, textAlign: "center" }}><Avatar sx={{ width: 64, height: 64, mx: "auto", mb: 2, bgcolor: "rgba(124,108,255,.18)", color: "primary.light" }}><AutoAwesomeRoundedIcon fontSize="large" /></Avatar><Typography variant="h5" fontWeight={900}>What can I help you find?</Typography><Typography color="text.secondary" mt={0.75}>Ask for a product, compare options, track an order, or search using a photo.</Typography><Stack direction="row" gap={1} justifyContent="center" flexWrap="wrap" mt={2}>{["Gaming laptop under $1,200", "Best running shoes", "Compare headphones", "Track my order"].map((prompt) => <Chip key={prompt} label={prompt} clickable variant="outlined" onClick={() => { setInput(prompt); void ask(prompt); }} />)}</Stack></Box>}
      <Box component="form" onSubmit={submit} sx={{ p: { xs: 1.25, md: 1.5 }, display: "flex", gap: 0.75, alignItems: "center", borderTop: "1px solid rgba(255,255,255,.08)", bgcolor: "rgba(7,10,18,.65)" }}>
        <input ref={uploadRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} />
        <Tooltip title="Search with a product photo"><IconButton aria-label="Upload product photo" onClick={() => uploadRef.current?.click()} disabled={loading} sx={{ flexShrink: 0, bgcolor: "rgba(255,255,255,.06)" }}><AddPhotoAlternateRoundedIcon /></IconButton></Tooltip>
        <Tooltip title={listening ? "Stop listening" : "Shop with your voice"}><IconButton color={listening ? "error" : "default"} aria-label={listening ? "Stop voice input" : "Start voice input"} onClick={toggleListening} disabled={loading} sx={{ flexShrink: 0, bgcolor: "rgba(255,255,255,.06)" }}>{listening ? <StopCircleRoundedIcon /> : <MicRoundedIcon />}</IconButton></Tooltip>
        <TextField fullWidth size="small" value={input} onChange={(event) => setInput(event.target.value)} placeholder={listening ? "Listening…" : "Describe what you want Emma to find…"} sx={{ minWidth: 0, "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "rgba(255,255,255,.04)" } }} />
        <Button type="submit" variant="contained" disabled={loading || !input.trim()} endIcon={loading ? <CircularProgress size={16} /> : <SendRoundedIcon />} sx={{ flexShrink: 0, minWidth: { xs: 48, sm: 130 }, px: { xs: 1.5, sm: 2 } }}><Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>{loading ? "Thinking…" : "Ask Emma"}</Box></Button>
      </Box>
    </Paper>
    {error && <Alert severity="error">{error}. Is the FastAPI server running?</Alert>}
    {selectedConversation && selectedConversation.messages.length > 0 && <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, bgcolor: "rgba(10,13,22,.55)" }}><Stack spacing={1.25}>
      {selectedConversation.messages.map((message) => <Paper key={message.id} variant="outlined" sx={{ p: 1.5, maxWidth: "85%", alignSelf: message.role === "user" ? "flex-end" : "flex-start", bgcolor: message.role === "user" ? "rgba(124,108,255,.14)" : "background.paper" }}>
        <Typography variant="caption" color={message.role === "user" ? "primary.light" : "secondary.main"}>{message.role === "user" ? "You" : "Emma"}</Typography>
        <Typography>{message.content}</Typography>
      </Paper>)}
    </Stack></Paper>}
    {result && <Box>
      <Stack direction="row" alignItems="center" spacing={1}><Typography variant="h5">Emma</Typography><IconButton aria-label="Read response aloud" onClick={() => speak(result.answer)}><VolumeUpRoundedIcon /></IconButton></Stack>
      <Typography color="text.secondary" mb={1}>{result.answer}</Typography>
      {result.order_proposal && <Paper variant="outlined" sx={{ my: 2, p: 2, borderColor: "secondary.main", bgcolor: "rgba(77,226,197,.07)" }}><Typography variant="overline" color="secondary.main" fontWeight={900}>Order agent · Exact-match proposal</Typography><Typography variant="h6" fontWeight={900}>{result.order_proposal.name}</Typography><Typography color="text.secondary">${result.order_proposal.price.toLocaleString()} · In stock · Quantity 1. Review the product card below, then add it to your cart and confirm delivery details at checkout.</Typography></Paper>}
      {result.memory_used && <Typography variant="caption" color="secondary.main" display="block" mb={3}>Personalized using your conversation memory</Typography>}
      <Grid container spacing={2}>{result.recommendations.map(({ product, reasons }) => <Grid key={product.id} size={{ xs: 12, md: 4 }}><ProductCard product={product} reasons={reasons} /></Grid>)}</Grid>
      <Paper variant="outlined" sx={{ mt: 3, p: 2 }}><Stack spacing={1}><Typography variant="subtitle2">Was this recommendation helpful?</Typography>{feedbackSent ? <Alert severity="success">Feedback saved. Thank you.</Alert> : <><Rating onChange={(_event, value) => rate(value)} /><TextField size="small" label="Optional feedback" value={feedbackComment} onChange={(event) => setFeedbackComment(event.target.value)} /></>}</Stack></Paper>
    </Box>}
  </Stack>;
}
