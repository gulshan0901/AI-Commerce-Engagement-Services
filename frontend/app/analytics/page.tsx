"use client";

import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import { Alert, Box, CircularProgress, Container, Grid, LinearProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { CommerceLayout } from "@/components/CommerceLayout";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getAnalytics } from "@/services/api";
import type { AnalyticsResponse } from "@/types";

export default function AnalyticsPage() {
  const { session, loading: authLoading } = useAuthSession();
  const [data, setData] = useState<AnalyticsResponse>();
  const [error, setError] = useState("");
  useEffect(() => {
    if (session) getAnalytics(session.access_token).then(setData).catch((caught) => setError(caught instanceof Error ? caught.message : "Analytics unavailable"));
  }, [session]);
  return <CommerceLayout><Container maxWidth="xl" sx={{ py: 7 }}><Stack direction="row" spacing={2} alignItems="center" mb={1}><InsightsRoundedIcon color="secondary" fontSize="large" /><Typography variant="h2">AI analytics</Typography></Stack><Typography color="text.secondary" mb={4}>User-scoped operational metrics calculated from real ACE events and customer feedback.</Typography>
    {authLoading && <CircularProgress />}
    {!authLoading && !session && <Alert severity="info">Sign in to view the analytics dashboard.</Alert>}
    {error && <Alert severity="error">{error}</Alert>}
    {data && <Stack spacing={3}><Grid container spacing={2}>{data.cards.map((card) => <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}><Paper sx={{ p: 2.5, height: "100%" }}><Typography color="text.secondary" variant="body2">{card.label}</Typography><Typography variant="h4" mt={1}>{card.label.includes("cost") ? "$" : ""}{card.value.toLocaleString()} <Typography component="span" color="text.secondary" variant="body2">{card.unit}</Typography></Typography></Paper></Grid>)}</Grid>
      <Grid container spacing={3}><Grid size={{ xs: 12, md: 8 }}><Paper sx={{ p: 2.5 }}><Typography variant="h5" mb={2}>Agent performance</Typography><Table><TableHead><TableRow><TableCell>Agent</TableCell><TableCell align="right">Requests</TableCell><TableCell align="right">Avg latency</TableCell><TableCell align="right">Satisfaction</TableCell></TableRow></TableHead><TableBody>{data.agent_performance.map((agent) => <TableRow key={agent.agent}><TableCell sx={{ textTransform: "capitalize" }}>{agent.agent.replace("_", " ")}</TableCell><TableCell align="right">{agent.requests}</TableCell><TableCell align="right">{agent.average_latency_ms} ms</TableCell><TableCell align="right">{agent.satisfaction ? `${agent.satisfaction}/5` : "—"}</TableCell></TableRow>)}</TableBody></Table></Paper></Grid>
      <Grid size={{ xs: 12, md: 4 }}><Paper sx={{ p: 2.5 }}><Typography variant="h5" mb={2}>Tool usage</Typography><Stack spacing={2}>{Object.entries(data.tool_usage).length ? Object.entries(data.tool_usage).map(([tool, count]) => <Box key={tool}><Stack direction="row" justifyContent="space-between"><Typography sx={{ textTransform: "capitalize" }}>{tool.replace("_", " ")}</Typography><Typography>{count}</Typography></Stack><LinearProgress variant="determinate" value={Math.min(100, count / Math.max(1, data.recent_events) * 100)} /></Box>) : <Typography color="text.secondary">Use the assistant to generate operational events.</Typography>}</Stack></Paper></Grid></Grid>
    </Stack>}
  </Container></CommerceLayout>;
}
