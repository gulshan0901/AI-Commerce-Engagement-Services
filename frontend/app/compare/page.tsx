"use client";

import { Alert, Box, Button, Checkbox, CircularProgress, Container, FormControlLabel, Grid, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { AuthPanel } from "@/components/AuthPanel";
import { CommerceLayout } from "@/components/CommerceLayout";
import { useAuthSession } from "@/hooks/useAuthSession";
import { compareProducts, getProducts } from "@/services/api";
import { CompareResponse, Product } from "@/types";

export default function ComparePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<CompareResponse>();
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const { session, loading } = useAuthSession();
  useEffect(() => { getProducts().then(setProducts).catch(() => setError("Catalogue unavailable")); }, []);
  function toggle(id: string) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 4 ? [...current, id] : current); }
  async function compare() {
    if (!session || selected.length < 2) return;
    setRunning(true); setError("");
    try { setResult(await compareProducts(selected, session.access_token)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Comparison failed"); }
    finally { setRunning(false); }
  }
  return <CommerceLayout><Container sx={{ py: 7 }}><Typography variant="h2" mb={1}>Compare products</Typography><Typography color="text.secondary" mb={4}>Select two to four catalogue products for a grounded specification matrix.</Typography>{loading ? <CircularProgress /> : !session ? <Paper sx={{ p: 4 }}><AuthPanel onDemo={() => undefined} /></Paper> : <Stack spacing={3}>
    <Grid container spacing={2}>{products.map((product) => <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4 }}><Paper sx={{ p: 2, borderColor: selected.includes(product.id) ? "primary.main" : undefined }}><FormControlLabel control={<Checkbox checked={selected.includes(product.id)} onChange={() => toggle(product.id)} />} label={`${product.name} — $${product.price.toLocaleString()}`} /></Paper></Grid>)}</Grid>
    <Button variant="contained" size="large" disabled={selected.length < 2 || running} onClick={compare}>{running ? "Comparing…" : `Compare ${selected.length} products`}</Button>
    {error && <Alert severity="error">{error}</Alert>}
    {result && <Stack spacing={2}><Alert severity="success">{result.verdict}</Alert><Paper sx={{ overflowX: "auto" }}><Box component="table" sx={{ width: "100%", borderCollapse: "collapse", "th, td": { p: 2, borderBottom: "1px solid rgba(255,255,255,.08)", textAlign: "left" } }}><thead><tr><th>Attribute</th>{result.products.map((product) => <th key={product.id}>{product.name}</th>)}</tr></thead><tbody>{result.rows.map((row) => <tr key={row.attribute}><td>{row.attribute}</td>{result.products.map((product) => <td key={product.id}>{row.values[product.id]}</td>)}</tr>)}</tbody></Box></Paper></Stack>}
  </Stack>}</Container></CommerceLayout>;
}
