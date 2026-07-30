"use client";

import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import { Alert, Avatar, Badge, Box, Button, Chip, CircularProgress, Fab, IconButton, Paper, Rating, Stack, TextField, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { sendChat, visualSearch } from "@/services/api";
import { useCart } from "@/features/cart/CartProvider";
import type { Recommendation } from "@/types";

type WidgetMessage = { role: "user" | "assistant"; content: string; recommendations?: Recommendation[]; imageUrl?: string; query?: string };
type RecognitionResultEvent = { results: ArrayLike<{ 0: { transcript: string } }> };
type Recognition = { lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void; onresult: ((event: RecognitionResultEvent) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };
type RecognitionConstructor = new () => Recognition;

export function ChatWidget() {
  const pathname = usePathname();
  const { session, loading: authLoading } = useAuthSession();
  const { add } = useCart();
  const uploadRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<Recognition | undefined>(undefined);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<WidgetMessage[]>([{ role: "assistant", content: "Hi! I’m Emma, your AI assistant, powered by OpenAI. How can I help you?" }]);
  const [conversationId, setConversationId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, loading, error, open]);

  if (pathname === "/assistant") return null;

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1; utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  async function ask(message: string, voiceReply = false) {
    if (!message.trim() || loading || !session) return;
    setInput(""); setError(""); setLoading(true);
    setMessages((current) => [...current, { role: "user", content: message }]);
    try {
      const result = await sendChat(message, conversationId, session.access_token);
      setConversationId(result.conversation_id);
      setMessages((current) => [...current, { role: "assistant", content: result.answer, recommendations: result.recommendations, query: message }]);
      if (voiceReply) speak(result.answer);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The assistant is unavailable"); }
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
    recognition.onerror = () => { setError("I couldn’t hear that. Please try again."); setListening(false); };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition; setListening(true); setError(""); recognition.start();
  }

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !session) return;
    if (!file.type.startsWith("image/") || file.size > 7_000_000) { setError("Choose a JPG, PNG, or WebP image smaller than 7 MB."); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result); setLoading(true); setError("");
      setMessages((current) => [...current, { role: "user", content: `Find products similar to ${file.name}`, imageUrl: dataUrl }]);
      try {
        const result = await visualSearch(dataUrl, file.name, session.access_token);
        const recommendations = [
          ...result.similar,
          ...result.cheaper_alternatives.map((item) => ({ ...item, reasons: ["Cheaper alternative", ...item.reasons] })),
          ...result.matching_accessories.map((item) => ({ ...item, reasons: ["Matching accessory", ...item.reasons] })),
        ].filter((item, index, items) => items.findIndex((candidate) => candidate.product.id === item.product.id) === index);
        setMessages((current) => [...current, { role: "assistant", content: result.analysis, recommendations, query: file.name.replace(/\.[^.]+$/, "") }]);
      } catch (caught) { setError(caught instanceof Error ? caught.message : "Visual search is unavailable"); }
      finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  }

  return <Box sx={{ position: "fixed", right: { xs: 16, md: 28 }, bottom: { xs: 16, md: 28 }, zIndex: 1400 }}>
    {open && <Paper elevation={24} sx={{ position: "absolute", right: 0, bottom: 76, width: { xs: "calc(100vw - 32px)", sm: 410 }, height: { xs: "min(650px, calc(100vh - 110px))", sm: 590 }, overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid rgba(124,108,255,.35)" }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2, py: 1.5, background: "linear-gradient(135deg, rgba(124,108,255,.3), rgba(77,226,197,.13))", borderBottom: "1px solid rgba(255,255,255,.08)" }}><Avatar sx={{ bgcolor: "primary.main" }}><SmartToyOutlinedIcon /></Avatar><Box flexGrow={1}><Typography fontWeight={850}>Emma - Shopping ACE Assistant</Typography><Typography variant="caption" color="secondary.main">Filter products or ask anything about the store</Typography></Box><IconButton aria-label="Close assistant" onClick={() => setOpen(false)}><CloseRoundedIcon /></IconButton></Stack>
      <Stack ref={messagesContainerRef} spacing={1.25} sx={{ p: 2, flexGrow: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain" }}>{messages.map((message, index) => <Stack key={`${message.role}-${index}`} spacing={1} sx={{ width: message.recommendations?.length ? "100%" : "auto", maxWidth: message.recommendations?.length ? "100%" : "88%", alignSelf: message.role === "user" ? "flex-end" : "flex-start" }}>
        {message.imageUrl && <Box component="img" src={message.imageUrl} alt="Uploaded product" sx={{ width: 150, height: 110, objectFit: "cover", borderRadius: 2, alignSelf: "flex-end" }} />}
        <Paper variant="outlined" sx={{ p: 1.25, alignSelf: message.role === "user" ? "flex-end" : "flex-start", bgcolor: message.role === "user" ? "rgba(124,108,255,.18)" : "background.default", whiteSpace: "pre-line" }}><Stack direction="row" spacing={1} alignItems="start"><Typography variant="body2">{message.content}</Typography>{message.role === "assistant" && <IconButton size="small" aria-label="Read response aloud" onClick={() => speak(message.content)}><VolumeUpRoundedIcon fontSize="small" /></IconButton>}</Stack></Paper>
        {message.recommendations?.length ? <Button component={Link} href={`/search?q=${encodeURIComponent(message.query ?? "")}&ids=${message.recommendations.map((item) => encodeURIComponent(item.product.id)).join(",")}`} size="small" variant="text" sx={{ alignSelf: "flex-start" }}>View all suggestions →</Button> : null}
        {message.recommendations?.map(({ product, reasons }) => <Paper key={product.id} variant="outlined" sx={{ overflow: "hidden", bgcolor: "background.default" }}><Stack component={Link} href={`/search?q=${encodeURIComponent(message.query ?? product.name)}&ids=${message.recommendations?.map((item) => encodeURIComponent(item.product.id)).join(",")}`} direction="row" sx={{ color: "inherit", textDecoration: "none", "&:hover": { bgcolor: "rgba(124,108,255,.07)" } }}><Box sx={{ width: 104, minHeight: 112, position: "relative", flexShrink: 0 }}><Image src={product.image_url} alt={product.name} fill sizes="104px" style={{ objectFit: "cover" }} /></Box><Stack spacing={0.5} sx={{ p: 1.25, minWidth: 0, flexGrow: 1 }}><Stack direction="row" justifyContent="space-between" gap={1}><Box minWidth={0}><Typography variant="caption" color="secondary.main">{product.brand}</Typography><Typography fontWeight={800} noWrap>{product.name}</Typography></Box><Typography fontWeight={850}>${product.price.toLocaleString()}</Typography></Stack><Stack direction="row" spacing={0.75} alignItems="center"><Rating value={product.rating} precision={0.1} size="small" readOnly /><Typography variant="caption">{product.rating}</Typography></Stack><Stack direction="row" gap={0.5} flexWrap="wrap">{reasons.slice(0, 2).map((reason) => <Chip key={reason} label={reason} size="small" sx={{ maxWidth: "100%" }} />)}</Stack></Stack></Stack><Stack direction="row" spacing={1} sx={{ p: 1 }}><Button component={Link} href={`/products/${product.id}`} size="small" variant="outlined" fullWidth>Details</Button><Button size="small" variant="contained" fullWidth disabled={!product.in_stock} startIcon={<AddShoppingCartRoundedIcon />} onClick={() => add(product)}>{product.in_stock ? "Add" : "Out of stock"}</Button></Stack></Paper>)}
      </Stack>)}{loading && <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={16} /><Typography variant="caption" color="text.secondary">Emma is thinking…</Typography></Stack>}{error && <Alert severity="error">{error}</Alert>}</Stack>
      {authLoading ? <Box p={2}><CircularProgress size={22} /></Box> : !session ? <Alert severity="info" sx={{ m: 2 }}>Sign in from the <Link href="/assistant">Assistant page</Link> to start chatting.</Alert> : <Paper component="form" onSubmit={submit} square variant="outlined" sx={{ p: 1, display: "flex", gap: 0.5, alignItems: "center" }}><input ref={uploadRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} /><Tooltip title="Upload product photo"><IconButton aria-label="Upload product photo" onClick={() => uploadRef.current?.click()} disabled={loading}><AddPhotoAlternateRoundedIcon /></IconButton></Tooltip><Tooltip title={listening ? "Stop listening" : "Speak to ACE"}><IconButton color={listening ? "error" : "default"} aria-label={listening ? "Stop voice input" : "Start voice input"} onClick={toggleListening} disabled={loading}>{listening ? <StopCircleRoundedIcon /> : <MicRoundedIcon />}</IconButton></Tooltip><TextField autoFocus fullWidth size="small" placeholder={listening ? "Listening…" : "Ask ACE anything…"} value={input} onChange={(event) => setInput(event.target.value)} /><Button type="submit" variant="contained" aria-label="Send message" disabled={!input.trim() || loading}><SendRoundedIcon /></Button></Paper>}
    </Paper>}
    <Badge color="secondary" variant="dot" invisible={open}><Fab color="primary" aria-label={open ? "Close AI assistant" : "Open AI assistant"} onClick={() => setOpen((current) => !current)}>{open ? <CloseRoundedIcon /> : <AutoAwesomeRoundedIcon />}</Fab></Badge>
  </Box>;
}
