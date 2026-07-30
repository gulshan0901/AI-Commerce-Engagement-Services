"use client";

/** Resolves typed or Emma-generated queries into focused product results. */

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Alert, Button, CircularProgress, Container, Grid, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CommerceLayout } from "@/components/CommerceLayout";
import { ProductCard } from "@/components/ProductCard";
import { getProduct, getProducts } from "@/services/api";
import type { Product } from "@/types";

function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const query = params.get("q") ?? "";
  const suggestedIds = (params.get("ids") ?? "").split(",").filter(Boolean);
  const [input, setInput] = useState(query);
  const [suggested, setSuggested] = useState<Product[]>([]);
  const [matches, setMatches] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setInput(query); setLoading(true); setError("");
    Promise.all([
      Promise.all(suggestedIds.map((id) => getProduct(id).catch(() => undefined))),
      suggestedIds.length ? Promise.resolve([] as Product[]) : getProducts(query),
    ]).then(([items, catalogue]) => {
      const selected = items.filter((item): item is Product => Boolean(item));
      setSuggested(selected); setMatches(catalogue);
    }).catch((caught) => setError(caught instanceof Error ? caught.message : "Search unavailable")).finally(() => setLoading(false));
  }, [query, params.get("ids")]);

  function submit(event: FormEvent) { event.preventDefault(); router.push(`/search?q=${encodeURIComponent(input.trim())}`); }
  return <CommerceLayout><Container maxWidth="xl" sx={{ py: 6 }}><Typography variant="h2">Search products</Typography><Typography color="text.secondary" mb={3}>{query ? <>Results for “{query}”</> : "Search the complete Supabase catalogue."}</Typography><Stack component="form" onSubmit={submit} direction={{ xs: "column", sm: "row" }} spacing={1.5} mb={5}><TextField fullWidth value={input} onChange={(event) => setInput(event.target.value)} placeholder="Search products, brands, or categories" InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }} /><Button type="submit" variant="contained" size="large">Search</Button></Stack>
    {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : <Stack spacing={5}>{suggested.length > 0 && <section><Typography variant="h4" fontWeight={900} mb={0.5}>Suggested by Emma</Typography><Typography color="text.secondary" mb={2}>Only the products selected during your assistant conversation.</Typography><Grid container spacing={2}>{suggested.map((product) => <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}><ProductCard product={product} reasons={["Suggested by Emma"]} /></Grid>)}</Grid></section>}{!suggestedIds.length && <section><Typography variant="h4" fontWeight={900} mb={2}>Catalogue matches</Typography><Grid container spacing={2}>{matches.map((product) => <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}><ProductCard product={product} /></Grid>)}{!matches.length && <Grid size={{ xs: 12 }}><Alert severity="info">No products match this search. Try a broader term or category.</Alert></Grid>}</Grid></section>}{suggestedIds.length > 0 && !suggested.length && <Alert severity="info">Emma’s suggested products are no longer available.</Alert>}</Stack>}
  </Container></CommerceLayout>;
}

export default function SearchPage() {
  return <Suspense fallback={<CommerceLayout><Container sx={{ py: 7 }}><CircularProgress /></Container></CommerceLayout>}><SearchResults /></Suspense>;
}
