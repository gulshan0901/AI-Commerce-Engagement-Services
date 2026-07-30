"use client";

import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import { Alert, Box, Button, CircularProgress, Grid, IconButton, Paper, Rating, Stack, TextField, Tooltip, Typography } from "@mui/material";
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
  const [input, setInput] = useState("I need a gaming laptop under $1200");
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
    recognition.onresult = (event) => { const transcript = event.results[0][0].transcript; setInput(transcript); void ask(transcript, true); };
    recognition.onerror = () => { setListening(false); setError("I couldn’t hear that. Please try again."); };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition; setListening(true); setError(""); recognition.start();
  }

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file || !token) return;
    if (!file.type.startsWith("image/") || file.size > 7_000_000) { setError("Choose a JPG, PNG, or WebP image smaller than 7 MB."); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      setLoading(true); setError("");
      try {
        const visual = await visualSearch(String(reader.result), file.name, token);
        const recommendations = [...visual.similar, ...visual.cheaper_alternatives.map((item) => ({ ...item, reasons: ["Cheaper alternative", ...item.reasons] })), ...visual.matching_accessories.map((item) => ({ ...item, reasons: ["Matching accessory", ...item.reasons] }))]
          .filter((item, index, items) => items.findIndex((candidate) => candidate.product.id === item.product.id) === index);
        setResult({ conversation_id: conversationId ?? "visual-search", answer: visual.analysis, recommendations, source: visual.source, memory_used: false, intent: "shopping" });
      } catch (caught) { setError(caught instanceof Error ? caught.message : "Visual search is unavailable"); }
      finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  }

  async function rate(value: number | null) {
    if (!value || !conversationId || !token) return;
    try { await submitFeedback(conversationId, value, feedbackComment, token); setFeedbackSent(true); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save feedback"); }
  }

  return <Stack spacing={3}>
    <Paper component="form" onSubmit={submit} sx={{ p: 2, display: "flex", gap: 1, alignItems: "center", background: "linear-gradient(135deg, rgba(124,108,255,.18), rgba(77,226,197,.06))" }}>
      <SmartToyOutlinedIcon color="primary" sx={{ mt: 1.5 }} />
      <input ref={uploadRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} />
      <Tooltip title="Upload product photo"><IconButton aria-label="Upload product photo" onClick={() => uploadRef.current?.click()} disabled={loading || !token}><AddPhotoAlternateRoundedIcon /></IconButton></Tooltip>
      <Tooltip title={listening ? "Stop listening" : "Speak to ACE"}><IconButton color={listening ? "error" : "default"} aria-label={listening ? "Stop voice input" : "Start voice input"} onClick={toggleListening} disabled={loading || !token}>{listening ? <StopCircleRoundedIcon /> : <MicRoundedIcon />}</IconButton></Tooltip>
      <TextField fullWidth variant="standard" value={input} onChange={(event) => setInput(event.target.value)} placeholder="What are you shopping for?" InputProps={{ disableUnderline: true }} />
      <Button type="submit" variant="contained" disabled={loading} endIcon={loading ? <CircularProgress size={16} /> : <SendRoundedIcon />}>{loading ? "Emma is thinking…" : "Ask Emma"}</Button>
    </Paper>
    {error && <Alert severity="error">{error}. Is the FastAPI server running?</Alert>}
    {selectedConversation && selectedConversation.messages.length > 0 && <Stack spacing={1.25}>
      {selectedConversation.messages.map((message) => <Paper key={message.id} variant="outlined" sx={{ p: 1.5, maxWidth: "85%", alignSelf: message.role === "user" ? "flex-end" : "flex-start", bgcolor: message.role === "user" ? "rgba(124,108,255,.14)" : "background.paper" }}>
        <Typography variant="caption" color={message.role === "user" ? "primary.light" : "secondary.main"}>{message.role === "user" ? "You" : "Assistant"}</Typography>
        <Typography>{message.content}</Typography>
      </Paper>)}
    </Stack>}
    {result && <Box>
      <Stack direction="row" alignItems="center" spacing={1}><Typography variant="h5">Emma</Typography><IconButton aria-label="Read response aloud" onClick={() => speak(result.answer)}><VolumeUpRoundedIcon /></IconButton></Stack>
      <Typography color="text.secondary" mb={1}>{result.answer}</Typography>
      {result.memory_used && <Typography variant="caption" color="secondary.main" display="block" mb={3}>Personalized using your conversation memory</Typography>}
      <Grid container spacing={2}>{result.recommendations.map(({ product, reasons }) => <Grid key={product.id} size={{ xs: 12, md: 4 }}><ProductCard product={product} reasons={reasons} /></Grid>)}</Grid>
      {token && <Paper variant="outlined" sx={{ mt: 3, p: 2 }}><Stack spacing={1}><Typography variant="subtitle2">Rate this response</Typography>{feedbackSent ? <Alert severity="success">Feedback saved. Thank you.</Alert> : <><Rating onChange={(_event, value) => rate(value)} /><TextField size="small" label="Optional feedback" value={feedbackComment} onChange={(event) => setFeedbackComment(event.target.value)} /></>}</Stack></Paper>}
    </Box>}
  </Stack>;
}
