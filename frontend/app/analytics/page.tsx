"use client";

/** Presents conversation, agent, token, latency, and tool-usage analytics. */

import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import { Alert, Box, CircularProgress, Container, Grid, LinearProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CommerceLayout } from "@/components/CommerceLayout";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getAnalytics, getObservabilityConversations } from "@/services/api";
import type { AnalyticsResponse, ObservabilityConversation } from "@/types";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export default function AnalyticsPage() {
  const { session, loading: authLoading } = useAuthSession();
  const [data, setData] = useState<AnalyticsResponse>();
  const [conversations, setConversations] = useState<ObservabilityConversation[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!session) return;
    Promise.all([getAnalytics(session.access_token), getObservabilityConversations(session.access_token)])
      .then(([analytics, items]) => { setData(analytics); setConversations(items); })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Analytics unavailable"));
  }, [session]);
  const turns = conversations.reduce((sum, item) => sum + item.turns, 0);
  const tokens = conversations.reduce((sum, item) => sum + item.total_tokens, 0);

  return <CommerceLayout><Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 }, minWidth: 0 }}><Stack direction="row" spacing={2} alignItems="flex-start" mb={1}><InsightsRoundedIcon color="secondary" fontSize="large" sx={{ flexShrink: 0, mt: 0.5 }} /><Box minWidth={0}><Typography variant="h2" fontSize={{ xs: 34, sm: 44, md: 52 }} sx={{ overflowWrap: "anywhere" }}>Agent Observability</Typography><Typography color="text.secondary">Conversation review, execution traces, cost and quality signals.</Typography></Box></Stack>
    {authLoading && <CircularProgress sx={{ mt: 4 }} />}
    {!authLoading && !session && <Alert severity="info" sx={{ mt: 4 }}>Sign in to view the analytics dashboard.</Alert>}
    {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
    {data && <Stack spacing={3} mt={4}>
      <Grid container spacing={2}>{[
        ["Conversations", conversations.length, ""], ["Turns", turns, ""], ["Tokens", tokens, ""],
        ...data.cards.slice(0, 3).map((card) => [card.label, card.value, card.unit]),
      ].map(([label, value, unit]) => <Grid key={String(label)} size={{ xs: 6, md: 2 }}><Paper sx={{ p: 2.5, height: "100%", background: "linear-gradient(145deg, rgba(124,92,255,.12), transparent)" }}><Typography color="text.secondary" variant="caption" textTransform="uppercase">{label}</Typography><Typography variant="h4" mt={1}>{compact.format(Number(value))}</Typography><Typography variant="caption" color="text.secondary">{unit}</Typography></Paper></Grid>)}</Grid>

      <Paper sx={{ overflow: "hidden", minWidth: 0 }}><Box p={{ xs: 2, sm: 2.5 }}><Typography variant="h5">Conversations</Typography><Typography color="text.secondary" variant="body2">Select a conversation to inspect every AI and tool call.</Typography></Box>
        <Box sx={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}><Table sx={{ minWidth: 760 }}><TableHead><TableRow><TableCell>Conversation</TableCell><TableCell>First message</TableCell><TableCell align="right">Turns</TableCell><TableCell align="right">Tokens</TableCell><TableCell>Last activity</TableCell></TableRow></TableHead><TableBody>
          {conversations.map((item) => <TableRow key={item.id} hover sx={{ "& a": { color: "success.main", textDecoration: "none" } }}><TableCell><Link href={`/analytics/conversations/${item.id}`}>{item.id.slice(0, 8)}…</Link><Typography variant="caption" display="block" color="text.secondary">chat</Typography></TableCell><TableCell sx={{ maxWidth: 480 }}><Typography noWrap>{item.first_message}</Typography></TableCell><TableCell align="right">{item.turns}</TableCell><TableCell align="right"><b>{item.total_tokens.toLocaleString()}</b><Typography variant="caption" display="block" color="text.secondary">In {item.input_tokens.toLocaleString()} · Out {item.output_tokens.toLocaleString()}</Typography></TableCell><TableCell>{new Date(item.last_activity).toLocaleString()}</TableCell></TableRow>)}
          {!conversations.length && <TableRow><TableCell colSpan={5}><Typography color="text.secondary">Chat with Emma to generate observable conversations.</Typography></TableCell></TableRow>}
        </TableBody></Table></Box>
      </Paper>

      <Grid container spacing={3}><Grid size={{ xs: 12, md: 8 }} minWidth={0}><Paper sx={{ p: { xs: 2, sm: 2.5 }, minWidth: 0, overflow: "hidden" }}><Typography variant="h5" mb={2}>Agent performance</Typography><Box sx={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}><Table sx={{ minWidth: 560 }}><TableHead><TableRow><TableCell>Agent</TableCell><TableCell align="right">Requests</TableCell><TableCell align="right">Avg latency</TableCell><TableCell align="right">Satisfaction</TableCell></TableRow></TableHead><TableBody>{data.agent_performance.map((agent) => <TableRow key={agent.agent}><TableCell sx={{ textTransform: "capitalize" }}>{agent.agent.replace("_", " ")}</TableCell><TableCell align="right">{agent.requests}</TableCell><TableCell align="right">{agent.average_latency_ms} ms</TableCell><TableCell align="right">{agent.satisfaction ? `${agent.satisfaction}/5` : "—"}</TableCell></TableRow>)}</TableBody></Table></Box></Paper></Grid>
      <Grid size={{ xs: 12, md: 4 }}><Paper sx={{ p: 2.5 }}><Typography variant="h5" mb={2}>Tool usage</Typography><Stack spacing={2}>{Object.entries(data.tool_usage).length ? Object.entries(data.tool_usage).map(([tool, count]) => <Box key={tool}><Stack direction="row" justifyContent="space-between"><Typography sx={{ textTransform: "capitalize" }}>{tool.replace("_", " ")}</Typography><Typography>{count}</Typography></Stack><LinearProgress color="secondary" variant="determinate" value={Math.min(100, count / Math.max(1, data.recent_events) * 100)} /></Box>) : <Typography color="text.secondary">Use Emma to generate operational events.</Typography>}</Stack></Paper></Grid></Grid>
    </Stack>}
  </Container></CommerceLayout>;
}
