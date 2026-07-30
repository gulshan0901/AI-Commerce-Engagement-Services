import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import { Box, Button, Chip, Container, Grid, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { CommerceLayout } from "@/components/CommerceLayout";

const benefits = [
  ["Grounded recommendations", "Every AI suggestion maps to a real catalogue record."],
  ["Explainable decisions", "See the price, rating, availability, and specifications behind each choice."],
  ["Continuous journey", "Browse normally or bring the assistant into any shopping decision."],
];

export default function HomePage() {
  return <CommerceLayout>
    <Box sx={{ background: "radial-gradient(circle at 78% 8%, rgba(124,108,255,.3), transparent 34%)" }}>
      <Container sx={{ py: { xs: 9, md: 15 } }}>
        <Grid container spacing={6} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}><Stack spacing={3}>
            <Chip icon={<VerifiedRoundedIcon />} label="Enterprise commerce intelligence" color="secondary" sx={{ alignSelf: "flex-start" }} />
            <Typography variant="h1" fontSize={{ xs: 50, md: 82 }} maxWidth={850}>Commerce that understands the customer.</Typography>
            <Typography color="text.secondary" fontSize={{ xs: 18, md: 21 }} maxWidth={700}>ACE combines a complete shopping experience with grounded AI discovery, comparison, recommendations, and support.</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button component={Link} href="/products" size="large" variant="contained" endIcon={<ArrowForwardRoundedIcon />}>Explore products</Button>
              <Button component={Link} href="/assistant" size="large" variant="outlined" startIcon={<AutoAwesomeRoundedIcon />}>Ask ACE</Button>
            </Stack>
          </Stack></Grid>
          <Grid size={{ xs: 12, md: 5 }}><Paper sx={{ p: 3, background: "linear-gradient(145deg, rgba(124,108,255,.18), rgba(77,226,197,.06))" }}><Typography color="secondary.main" fontWeight={800}>Try asking</Typography>{["Gaming laptop under $1,200", "Lightweight running shoes", "Compare the best options"].map((text) => <Paper key={text} variant="outlined" sx={{ p: 2, mt: 1.5 }}>{text}</Paper>)}</Paper></Grid>
        </Grid>
      </Container>
    </Box>
    <Container><Grid container spacing={2}>{benefits.map(([title, copy]) => <Grid key={title} size={{ xs: 12, md: 4 }}><Paper sx={{ p: 3, height: "100%" }}><Typography variant="h6" fontWeight={850}>{title}</Typography><Typography color="text.secondary" mt={1}>{copy}</Typography></Paper></Grid>)}</Grid></Container>
  </CommerceLayout>;
}

