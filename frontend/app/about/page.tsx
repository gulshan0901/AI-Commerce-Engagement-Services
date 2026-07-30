/** Explains the platform architecture, purpose, and engineering principles. */
import { Container, Grid, Paper, Stack, Typography } from "@mui/material";
import { CommerceLayout } from "@/components/CommerceLayout";

export default function AboutPage() {
  return <CommerceLayout><Container sx={{ py: 8 }}><Grid container spacing={5}><Grid size={{ xs: 12, md: 7 }}><Stack spacing={3}><Typography variant="h2">AI engagement—not another marketplace.</Typography><Typography color="text.secondary" fontSize={19}>ACE demonstrates how a production commerce platform can use generative AI across discovery, comparison, recommendation, support, and post-purchase journeys without sacrificing grounding or user control.</Typography><Typography color="text.secondary">The system combines Next.js, FastAPI, Supabase PostgreSQL, pgvector, Supabase Auth, and the OpenAI Responses API behind clear domain boundaries.</Typography></Stack></Grid><Grid size={{ xs: 12, md: 5 }}><Paper sx={{ p: 4 }}><Typography variant="h5" fontWeight={900} mb={2}>Engineering principles</Typography>{["Commerce works without AI", "Models never own business data", "Every recommendation is explainable", "Secrets stay on the backend", "Fallbacks keep development reliable"].map((item) => <Typography key={item} py={1}>✓ {item}</Typography>)}</Paper></Grid></Grid></Container></CommerceLayout>;
}
