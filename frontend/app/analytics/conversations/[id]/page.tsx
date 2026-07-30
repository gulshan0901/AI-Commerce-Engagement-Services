"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, CircularProgress, Container, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CommerceLayout } from "@/components/CommerceLayout";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getConversationObservability, getImprovementIdeas, reviewConversation } from "@/services/api";
import type { ConversationObservability, ConversationReview, ImprovementResponse, ObservabilityTurn } from "@/types";

function Trace({ turn }: { turn: ObservabilityTurn }) {
  const total = Math.max(1, turn.spans.reduce((sum, span) => sum + span.duration_ms, 0));
  return <Box mt={2} pt={2} borderTop="1px solid" borderColor="divider"><Typography variant="overline" color="text.secondary">Execution trace</Typography>
    <Stack direction="row" spacing={2} mt={1} mb={2}><Typography variant="caption"><Box component="span" sx={{ display: "inline-block", width: 9, height: 9, bgcolor: "#42a5f5", mr: .7 }} />LLM call</Typography><Typography variant="caption"><Box component="span" sx={{ display: "inline-block", width: 9, height: 9, bgcolor: "#ffa657", mr: .7 }} />Tool call</Typography></Stack>
    <Stack spacing={1}>{turn.spans.map((span, index) => <Grid container spacing={1} alignItems="center" key={`${span.name}-${index}`}><Grid size={{ xs: 4, md: 2.5 }}><Typography variant="caption">{span.name}</Typography></Grid><Grid size={{ xs: 8, md: 6 }}><Box sx={{ width: `${Math.max(7, span.duration_ms / total * 100)}%`, height: 18, borderRadius: 1, bgcolor: span.kind === "llm" ? "#42a5f5" : "#ffa657" }} /></Grid><Grid size={{ xs: 4, md: 1.2 }}><Typography variant="caption" color="text.secondary">{span.duration_ms} ms</Typography></Grid><Grid size={{ xs: 8, md: 2.3 }}><Typography variant="caption" color="text.secondary">{(span.input_tokens + span.output_tokens).toLocaleString()} tokens · In {span.input_tokens} · Out {span.output_tokens}</Typography></Grid></Grid>)}</Stack>
    <Box mt={2}><Typography variant="overline" color="text.secondary">Payloads</Typography>{turn.spans.map((span, index) => <Accordion disableGutters key={index} sx={{ bgcolor: "transparent" }}><AccordionSummary><Typography variant="body2">{span.kind.toUpperCase()} {index + 1} · {span.name}</Typography></AccordionSummary><AccordionDetails><Typography component="pre" variant="caption" sx={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(span, null, 2)}</Typography></AccordionDetails></Accordion>)}</Box>
  </Box>;
}

export default function ConversationAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const { session, loading: authLoading } = useAuthSession();
  const [data, setData] = useState<ConversationObservability>();
  const [review, setReview] = useState<ConversationReview>();
  const [ideas, setIdeas] = useState<ImprovementResponse>();
  const [feedback, setFeedback] = useState("");
  const [area, setArea] = useState("All turns");
  const [focus, setFocus] = useState("Overall experience");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { if (session && id) getConversationObservability(id, session.access_token).then(setData).catch((e) => setError(e.message)); }, [id, session]);

  const analyze = async () => { if (!session) return; setBusy("review"); setError(""); try { setReview(await reviewConversation(id, session.access_token)); } catch (e) { setError(e instanceof Error ? e.message : "Analysis failed"); } finally { setBusy(""); } };
  const improve = async () => { if (!session || !feedback.trim()) return; setBusy("ideas"); setError(""); try { setIdeas(await getImprovementIdeas(id, feedback, area, focus, session.access_token)); } catch (e) { setError(e instanceof Error ? e.message : "Optimization failed"); } finally { setBusy(""); } };
  const download = () => { if (!data) return; const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = `ace-trace-${id}.json`; link.click(); URL.revokeObjectURL(url); };

  return <CommerceLayout><Container maxWidth="xl" sx={{ py: 5 }}>
    <Button component={Link} href="/analytics" startIcon={<ArrowBackRoundedIcon />} color="inherit">All conversations</Button>
    {authLoading && <CircularProgress sx={{ mt: 4 }} />}{!authLoading && !session && <Alert severity="info" sx={{ mt: 3 }}>Sign in to inspect conversations.</Alert>}{error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
    {data && <Stack spacing={3} mt={2}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}><Box><Typography variant="h4">{data.conversation.id} <Chip size="small" label="chat" /></Typography><Typography color="text.secondary">{data.conversation.turns} turns · {data.conversation.total_tokens.toLocaleString()} tokens</Typography><Typography variant="caption" color="text.secondary">In {data.conversation.input_tokens.toLocaleString()} · Out {data.conversation.output_tokens.toLocaleString()}</Typography></Box><Button variant="contained" color="success" startIcon={<DownloadRoundedIcon />} onClick={download}>Download trace bundle</Button></Stack>

      <Paper sx={{ p: 3 }}><Stack direction="row" justifyContent="space-between" alignItems="start"><Box><Typography variant="h5">AI Review & Optimization</Typography><Typography color="text.secondary" mt={1}>Run a secondary assistant to critique this conversation&apos;s prompts, tool usage, and behavior.</Typography></Box>{review && <Typography variant="h3" color="success.main">{review.score}/5</Typography>}</Stack>
        {!review ? <Button variant="contained" color="success" sx={{ mt: 2 }} disabled={busy === "review"} onClick={analyze}>{busy === "review" ? "Analyzing…" : "Analyze conversation"}</Button> : <Box mt={2}><Typography>{review.summary}</Typography><Grid container spacing={3} mt={.5}><Grid size={{ xs: 12, md: 4 }}><Typography fontWeight={700}>Tool usage issues</Typography>{review.tool_issues.map((x) => <Typography key={x} component="li" variant="body2">{x}</Typography>)}</Grid><Grid size={{ xs: 12, md: 4 }}><Typography fontWeight={700}>Behavior observations</Typography>{review.behavior_observations.map((x) => <Typography key={x} component="li" variant="body2">{x}</Typography>)}</Grid><Grid size={{ xs: 12, md: 4 }}><Typography fontWeight={700}>Efficiency notes</Typography>{review.efficiency_notes.map((x) => <Typography key={x} component="li" variant="body2">{x}</Typography>)}</Grid></Grid><Button color="success" variant="contained" sx={{ mt: 2 }} onClick={analyze}>Re-run analysis</Button></Box>}
      </Paper>

      <Paper sx={{ p: 3 }}><Typography variant="h5">Feedback-Guided AI Optimization</Typography><Typography color="text.secondary" mt={1}>Share what would make this conversation stronger. The analyzer will suggest improvements across prompts, tools, orchestration, UI, and tests.</Typography><TextField fullWidth multiline minRows={3} sx={{ mt: 2 }} label="What would have made this conversation stronger?" placeholder="Example: Emma found products, but I wanted her to ask about room size first." value={feedback} onChange={(e) => setFeedback(e.target.value)} /><Grid container spacing={2} mt={.5}><Grid size={{ xs: 12, md: 6 }}><FormControl fullWidth><InputLabel>Conversation area</InputLabel><Select label="Conversation area" value={area} onChange={(e) => setArea(e.target.value)}><MenuItem value="All turns">All turns</MenuItem><MenuItem value="Assistant responses">Assistant responses</MenuItem><MenuItem value="Tool usage">Tool usage</MenuItem></Select></FormControl></Grid><Grid size={{ xs: 12, md: 6 }}><FormControl fullWidth><InputLabel>Improvement focus</InputLabel><Select label="Improvement focus" value={focus} onChange={(e) => setFocus(e.target.value)}><MenuItem value="Overall experience">Overall experience</MenuItem><MenuItem value="Accuracy">Accuracy</MenuItem><MenuItem value="Efficiency">Efficiency</MenuItem><MenuItem value="Safety">Safety</MenuItem></Select></FormControl></Grid></Grid><Button variant="contained" color="success" sx={{ mt: 2 }} disabled={!feedback.trim() || busy === "ideas"} onClick={improve}>{busy === "ideas" ? "Generating…" : "Get improvement ideas"}</Button>{ideas && <Alert severity="success" sx={{ mt: 2 }}>{ideas.ideas.map((idea) => <Typography component="li" key={idea}>{idea}</Typography>)}</Alert>}</Paper>

      {data.turns.map((turn) => <Paper key={turn.number} sx={{ p: 3 }}><Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Chip size="small" label={`Turn ${turn.number}`} /><Chip size="small" label={turn.agent} /><Chip color="success" size="small" label={`${(turn.input_tokens + turn.output_tokens).toLocaleString()} tokens`} /><Chip size="small" label={`In ${turn.input_tokens}`} /><Chip size="small" label={`Out ${turn.output_tokens}`} /><Chip size="small" label={`${turn.latency_ms} ms`} /><Chip size="small" label={`${turn.spans.filter((x) => x.kind === "llm").length} LLM`} /><Chip size="small" label={`${turn.spans.filter((x) => x.kind === "tool").length} tools`} /></Stack><Typography mt={2}><b>User:</b> {turn.user_message}</Typography><Typography mt={1}><b>Emma:</b> {turn.assistant_message}</Typography><Trace turn={turn} /></Paper>)}
    </Stack>}
  </Container></CommerceLayout>;
}
