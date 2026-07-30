"use client";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Alert, CircularProgress, Grid, InputAdornment, LinearProgress, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { getProducts } from "@/services/api";
import { Product } from "@/types";

export function ProductListing({ initialQuery = "", category }: { initialQuery?: string; category?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true); setError("");
      getProducts(query).then((items) => setProducts(category ? items.filter((item) => item.category === category) : items)).catch((caught) => setError(caught instanceof Error ? caught.message : "Catalogue unavailable")).finally(() => setLoading(false));
    }, query === initialQuery ? 0 : 250);
    return () => window.clearTimeout(timer);
  }, [category, initialQuery, query]);

  return <Stack spacing={3}>
    <TextField value={query} onChange={(event) => setQuery(event.target.value)} label="Search products" placeholder="Product, brand, category, or use case" inputProps={{ "aria-describedby": "catalogue-status" }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }} />
    <Typography id="catalogue-status" className="sr-only" role="status" aria-live="polite">{loading ? "Loading products" : `${products.length} products found`}</Typography>
    {error && <Alert severity="error">{error}. Start the FastAPI backend on port 8000.</Alert>}
    {loading && products.length > 0 && <LinearProgress />}
    {loading && products.length === 0 ? <CircularProgress /> : <Grid container spacing={2}>
      {products.map((product) => <Grid key={product.id} size={{ xs: 12, sm: 6, lg: 4 }}><ProductCard product={product} /></Grid>)}
      {!products.length && !error && <Typography color="text.secondary">No products match this search.</Typography>}
    </Grid>}
  </Stack>;
}
