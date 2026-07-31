"use client";

/** Implements the floating text, voice, and visual-search Emma assistant. */

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
import { sendChat, visualSearch } from "@/services/api";
import { useCart } from "@/features/cart/CartProvider";
import type { Recommendation } from "@/types";

type WidgetMessage = { role: "user" | "assistant"; content: string; recommendations?: Recommendation[]; imageUrl?: string; query?: string };
type RecognitionResultEvent = { results: ArrayLike<{ 0: { transcript: string } }> };
type Recognition = { lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void; onresult: ((event: RecognitionResultEvent) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };
type RecognitionConstructor = new () => Recognition;

export function ChatWidget() {
  const pathname = usePathname();
  const { add } = useCart();
  const uploadRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<Recognition | undefined>(undefined);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<WidgetMessage[]>([{ role: "assistant", content: "Hi! I’m Emma, your AI shopping assistant. What can I help you find today?" }]);
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
    if (!message.trim() || loading) return;
    setInput(""); setError(""); setLoading(true);
    setMessages((current) => [...current, { role: "user", content: message }]);
    try {
      const result = await sendChat(message, conversationId);
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
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      window.setTimeout(() => void ask(transcript, true), 350);
    };
    recognition.onerror = () => { setError("I couldn’t hear that. Please try again."); setListening(false); };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition; setListening(true); setError(""); recognition.start();
  }

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 7_000_000) { setError("Choose a JPG, PNG, or WebP image smaller than 7 MB."); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result); setLoading(true); setError("");
      setMessages((current) => [...current, { role: "user", content: `Find products similar to ${file.name}`, imageUrl: dataUrl }]);
      try {
        const result = await visualSearch(dataUrl, file.name, "");
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

  return <Box sx={{ position: "fixed", right: { xs: 12, md: 28 }, bottom: { xs: "max(12px, env(safe-area-inset-bottom))", md: 28 }, zIndex: 1400 }}>
    {open && <Paper elevation={24} sx={{ position: { xs: "fixed", sm: "absolute" }, top: { xs: "max(10px, env(safe-area-inset-top))", sm: "auto" }, left: { xs: 10, sm: "auto" }, right: { xs: 10, sm: 0 }, bottom: { xs: "max(10px, env(safe-area-inset-bottom))", sm: 76 }, width: { xs: "auto", sm: 430 }, height: { xs: "auto", sm: 640 }, maxHeight: { sm: "calc(100dvh - 108px)" }, boxSizing: "border-box", borderRadius: "16px !important", overflow: "hidden", display: "flex", flexDirection: "column", bgcolor: "#111521", border: "1px solid rgba(124,108,255,.32)", boxShadow: "0 28px 90px rgba(0,0,0,.55)" }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: { xs: 1.5, sm: 2 }, py: 1.4, background: "linear-gradient(135deg, #25294a 0%, #183c42 100%)", borderBottom: "1px solid rgba(255,255,255,.08)" }}><Avatar sx={{ width: 42, height: 42, bgcolor: "primary.main", boxShadow: "0 0 0 4px rgba(124,108,255,.16)" }}><SmartToyOutlinedIcon /></Avatar><Box flexGrow={1} minWidth={0}><Typography fontWeight={900} noWrap>Emma <Box component="span" sx={{ color: "text.secondary", fontWeight: 600 }}>· AI shopping assistant</Box></Typography><Stack direction="row" spacing={0.75} alignItems="center"><Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "secondary.main" }} /><Typography variant="caption" color="secondary.main">Online · Text, voice & visual search</Typography></Stack></Box><IconButton aria-label="Close assistant" onClick={() => setOpen(false)} sx={{ bgcolor: "rgba(255,255,255,.06)" }}><CloseRoundedIcon /></IconButton></Stack>
      {messages.length === 1 && <Stack direction="row" gap={0.75} sx={{ px: 1.5, pt: 1.5, overflowX: "auto", flexShrink: 0, "&::-webkit-scrollbar": { display: "none" } }}>{["Laptop under $1,200", "Running shoes", "Track my order"].map((prompt) => <Chip key={prompt} label={prompt} variant="outlined" clickable onClick={() => void ask(prompt)} sx={{ flexShrink: 0, bgcolor: "rgba(124,108,255,.07)" }} />)}</Stack>}
      <Stack ref={messagesContainerRef} spacing={1.5} sx={{ p: 1.5, flexGrow: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", background: "radial-gradient(circle at 50% 0%, rgba(124,108,255,.08), transparent 38%)" }}>{messages.map((message, index) => <Stack key={`${message.role}-${index}`} spacing={1} sx={{ width: message.recommendations?.length ? "100%" : "auto", maxWidth: message.recommendations?.length ? "100%" : "88%", alignSelf: message.role === "user" ? "flex-end" : "flex-start" }}>
        {message.imageUrl && <Box component="img" src={message.imageUrl} alt="Uploaded product" sx={{ width: 150, height: 110, objectFit: "cover", borderRadius: 2, alignSelf: "flex-end" }} />}
        <Paper variant="outlined" sx={{ p: 1.35, alignSelf: message.role === "user" ? "flex-end" : "flex-start", bgcolor: message.role === "user" ? "primary.main" : "rgba(21,25,38,.96)", borderColor: message.role === "user" ? "primary.main" : "rgba(255,255,255,.1)", borderRadius: message.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", whiteSpace: "pre-line", boxShadow: "0 8px 24px rgba(0,0,0,.16)" }}><Stack direction="row" spacing={0.75} alignItems="start"><Typography variant="body2" lineHeight={1.55}>{message.content}</Typography>{message.role === "assistant" && <IconButton size="small" aria-label="Read response aloud" onClick={() => speak(message.content)} sx={{ mt: -0.5, mr: -0.75 }}><VolumeUpRoundedIcon fontSize="small" /></IconButton>}</Stack></Paper>
        {message.recommendations?.length ? <Button component={Link} href={`/search?q=${encodeURIComponent(message.query ?? "")}&ids=${message.recommendations.map((item) => encodeURIComponent(item.product.id)).join(",")}`} size="small" variant="text" sx={{ alignSelf: "flex-start" }}>View all suggestions →</Button> : null}
        {message.recommendations?.map(({ product, reasons }) => <Paper key={product.id} variant="outlined" sx={{ overflow: "hidden", bgcolor: "background.default" }}><Stack component={Link} href={`/search?q=${encodeURIComponent(message.query ?? product.name)}&ids=${message.recommendations?.map((item) => encodeURIComponent(item.product.id)).join(",")}`} direction="row" sx={{ color: "inherit", textDecoration: "none", "&:hover": { bgcolor: "rgba(124,108,255,.07)" } }}><Box sx={{ width: 104, minHeight: 112, position: "relative", flexShrink: 0 }}><Image src={product.image_url} alt={product.name} fill sizes="104px" style={{ objectFit: "cover" }} /></Box><Stack spacing={0.5} sx={{ p: 1.25, minWidth: 0, flexGrow: 1 }}><Stack direction="row" justifyContent="space-between" gap={1}><Box minWidth={0}><Typography variant="caption" color="secondary.main">{product.brand}</Typography><Typography fontWeight={800} noWrap>{product.name}</Typography></Box><Typography fontWeight={850}>${product.price.toLocaleString()}</Typography></Stack><Stack direction="row" spacing={0.75} alignItems="center"><Rating value={product.rating} precision={0.1} size="small" readOnly /><Typography variant="caption">{product.rating}</Typography></Stack><Stack direction="row" gap={0.5} flexWrap="wrap">{reasons.slice(0, 2).map((reason) => <Chip key={reason} label={reason} size="small" sx={{ maxWidth: "100%" }} />)}</Stack></Stack></Stack><Stack direction="row" spacing={1} sx={{ p: 1 }}><Button component={Link} href={`/products/${product.id}`} size="small" variant="outlined" fullWidth>Details</Button><Button size="small" variant="contained" fullWidth disabled={!product.in_stock} startIcon={<AddShoppingCartRoundedIcon />} onClick={() => add(product)}>{product.in_stock ? "Add" : "Out of stock"}</Button></Stack></Paper>)}
      </Stack>)}{loading && <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={16} /><Typography variant="caption" color="text.secondary">Emma is thinking…</Typography></Stack>}{error && <Alert severity="error">{error}</Alert>}</Stack>
      <Paper component="form" onSubmit={submit} square elevation={0} sx={{ p: { xs: 1, sm: 1.25 }, display: "flex", gap: 0.65, alignItems: "center", flexShrink: 0, bgcolor: "rgba(12,15,24,.98)", borderTop: "1px solid rgba(255,255,255,.09)" }}><input ref={uploadRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} /><Tooltip title="Search with a photo"><IconButton aria-label="Upload product photo" onClick={() => uploadRef.current?.click()} disabled={loading} sx={{ width: { xs: 38, sm: 42 }, height: { xs: 38, sm: 42 }, flexShrink: 0, bgcolor: "rgba(255,255,255,.06)" }}><AddPhotoAlternateRoundedIcon /></IconButton></Tooltip><Tooltip title={listening ? "Stop listening" : "Shop with your voice"}><IconButton color={listening ? "error" : "default"} aria-label={listening ? "Stop voice input" : "Start voice input"} onClick={toggleListening} disabled={loading} sx={{ width: { xs: 38, sm: 42 }, height: { xs: 38, sm: 42 }, flexShrink: 0, bgcolor: "rgba(255,255,255,.06)" }}>{listening ? <StopCircleRoundedIcon /> : <MicRoundedIcon />}</IconButton></Tooltip><TextField size="small" placeholder={listening ? "Listening…" : "Ask Emma anything…"} value={input} onChange={(event) => setInput(event.target.value)} sx={{ flex: 1, minWidth: 0, "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "rgba(255,255,255,.045)" } }} /><IconButton type="submit" color="primary" aria-label="Send message" disabled={!input.trim() || loading} sx={{ width: { xs: 38, sm: 42 }, height: { xs: 38, sm: 42 }, flexShrink: 0, bgcolor: "primary.main", color: "primary.contrastText", "&:hover": { bgcolor: "primary.dark" }, "&.Mui-disabled": { bgcolor: "rgba(255,255,255,.07)" } }}><SendRoundedIcon /></IconButton></Paper>
    </Paper>}
    <Badge color="secondary" variant="dot" invisible={open} sx={{ display: open ? { xs: "none", sm: "inline-flex" } : "inline-flex" }}><Fab color="primary" aria-label={open ? "Close AI assistant" : "Open AI assistant"} onClick={() => setOpen((current) => !current)}>{open ? <CloseRoundedIcon /> : <AutoAwesomeRoundedIcon />}</Fab></Badge>
  </Box>;
}
