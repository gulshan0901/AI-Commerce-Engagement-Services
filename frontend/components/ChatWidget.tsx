"use client";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import { Alert, Avatar, Badge, Box, Button, CircularProgress, Fab, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { sendChat } from "@/services/api";

type WidgetMessage = { role: "user" | "assistant"; content: string };

export function ChatWidget() {
  const pathname = usePathname();
  const { session, loading: authLoading } = useAuthSession();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<WidgetMessage[]>([
    { role: "assistant", content: "Hi! I’m ACE. Tell me what you’re shopping for, or ask about an order or return." },
  ]);
  const [conversationId, setConversationId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (pathname === "/assistant") return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading || !session) return;
    setInput(""); setError(""); setLoading(true);
    setMessages((current) => [...current, { role: "user", content: message }]);
    try {
      const result = await sendChat(message, conversationId, session.access_token);
      setConversationId(result.conversation_id);
      const products = result.recommendations.map(({ product }) => product.name).join(", ");
      setMessages((current) => [...current, {
        role: "assistant", content: `${result.answer}${products ? `\n\nRecommended: ${products}` : ""}`,
      }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The assistant is unavailable");
    } finally { setLoading(false); }
  }

  return <Box sx={{ position: "fixed", right: { xs: 16, md: 28 }, bottom: { xs: 16, md: 28 }, zIndex: 1400 }}>
    {open && <Paper elevation={24} sx={{ position: "absolute", right: 0, bottom: 76, width: { xs: "calc(100vw - 32px)", sm: 390 }, height: { xs: "min(620px, calc(100vh - 120px))", sm: 560 }, overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid rgba(124,108,255,.35)" }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2, py: 1.5, background: "linear-gradient(135deg, rgba(124,108,255,.3), rgba(77,226,197,.13))", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <Avatar sx={{ bgcolor: "primary.main" }}><SmartToyOutlinedIcon /></Avatar><Box flexGrow={1}><Typography fontWeight={850}>ACE Assistant</Typography><Typography variant="caption" color="secondary.main">Shopping team online</Typography></Box><IconButton aria-label="Close assistant" onClick={() => setOpen(false)}><CloseRoundedIcon /></IconButton>
      </Stack>
      <Stack spacing={1.25} sx={{ p: 2, flexGrow: 1, overflowY: "auto" }}>
        {messages.map((message, index) => <Paper key={`${message.role}-${index}`} variant="outlined" sx={{ p: 1.25, maxWidth: "88%", alignSelf: message.role === "user" ? "flex-end" : "flex-start", bgcolor: message.role === "user" ? "rgba(124,108,255,.18)" : "background.default", whiteSpace: "pre-line" }}><Typography variant="body2">{message.content}</Typography></Paper>)}
        {loading && <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={16} /><Typography variant="caption" color="text.secondary">Agents are working…</Typography></Stack>}
        {error && <Alert severity="error">{error}</Alert>}
      </Stack>
      {authLoading ? <Box p={2}><CircularProgress size={22} /></Box> : !session ? <Alert severity="info" sx={{ m: 2 }}>Sign in from the <Link href="/assistant">Assistant page</Link> to start chatting.</Alert> : <Paper component="form" onSubmit={submit} square variant="outlined" sx={{ p: 1.25, display: "flex", gap: 1 }}><TextField autoFocus fullWidth size="small" placeholder="Ask ACE anything…" value={input} onChange={(event) => setInput(event.target.value)} /><Button type="submit" variant="contained" aria-label="Send message" disabled={!input.trim() || loading}><SendRoundedIcon /></Button></Paper>}
    </Paper>}
    <Badge color="secondary" variant="dot" invisible={open}><Fab color="primary" aria-label={open ? "Close AI assistant" : "Open AI assistant"} onClick={() => setOpen((current) => !current)}>{open ? <CloseRoundedIcon /> : <AutoAwesomeRoundedIcon />}</Fab></Badge>
  </Box>;
}
