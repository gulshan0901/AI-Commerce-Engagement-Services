"use client";

/** Coordinates debounced filtering and accessible infinite catalogue pagination. */

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Alert, Box, Button, CircularProgress, Grid, InputAdornment, LinearProgress, Stack, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { getProductPage } from "@/services/api";
import { Product } from "@/types";

const PAGE_SIZE = 18;

export function ProductListing({ initialQuery = "", category }: { initialQuery?: string; category?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestVersionRef = useRef(0);

  // Debouncing avoids restarting pagination for every keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), query === initialQuery ? 0 : 300);
    return () => window.clearTimeout(timer);
  }, [initialQuery, query]);

  // A query or category change starts a new independently cancelable result set.
  useEffect(() => {
    const controller = new AbortController();
    const requestVersion = ++requestVersionRef.current;
    setProducts([]); setTotal(0); setLoading(true); setError("");
    getProductPage({ query: debouncedQuery, category, offset: 0, limit: PAGE_SIZE, signal: controller.signal })
      .then((page) => {
        if (requestVersion !== requestVersionRef.current) return;
        setProducts(page.items); setTotal(page.total);
      })
      .catch((caught) => {
        if (controller.signal.aborted || requestVersion !== requestVersionRef.current) return;
        setError(caught instanceof Error ? caught.message : "Catalogue unavailable");
      })
      .finally(() => { if (requestVersion === requestVersionRef.current) setLoading(false); });
    return () => controller.abort();
  }, [category, debouncedQuery]);

  const loadMore = useCallback(async () => {
    if (loading || products.length >= total) return;
    const requestVersion = requestVersionRef.current;
    setLoading(true); setError("");
    try {
      const page = await getProductPage({ query: debouncedQuery, category, offset: products.length, limit: PAGE_SIZE });
      if (requestVersion !== requestVersionRef.current) return;
      // Deduplication protects the UI if catalogue rows change between page requests.
      setProducts((current) => [...current, ...page.items.filter((item) => !current.some((existing) => existing.id === item.id))]);
      setTotal(page.total);
    } catch (caught) {
      if (requestVersion === requestVersionRef.current) setError(caught instanceof Error ? caught.message : "More products could not be loaded");
    } finally {
      if (requestVersion === requestVersionRef.current) setLoading(false);
    }
  }, [category, debouncedQuery, loading, products.length, total]);

  // The sentinel preloads the next page shortly before it enters the viewport.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading || products.length >= total) return;
    let requested = false;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !requested) { requested = true; void loadMore(); }
    }, { rootMargin: "500px 0px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, loading, products.length, total]);

  const hasMore = products.length < total;
  return <Stack spacing={3}>
    <TextField value={query} onChange={(event) => setQuery(event.target.value)} label="Search products" placeholder="Product, brand, category, or use case" inputProps={{ "aria-describedby": "catalogue-status" }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }} />
    <Typography id="catalogue-status" className="sr-only" role="status" aria-live="polite">{loading && !products.length ? "Loading products" : `Showing ${products.length} of ${total} products`}</Typography>
    {error && <Alert severity="error" action={hasMore ? <Button color="inherit" onClick={() => void loadMore()}>Retry</Button> : undefined}>{error}</Alert>}
    {loading && products.length > 0 && <LinearProgress aria-label="Loading more products" />}
    {loading && products.length === 0 ? <Box textAlign="center" py={6}><CircularProgress aria-label="Loading products" /></Box> : <Grid container spacing={2}>
      {products.map((product) => <Grid key={product.id} size={{ xs: 12, sm: 6, lg: 4 }}><ProductCard product={product} /></Grid>)}
      {!products.length && !error && <Grid size={{ xs: 12 }}><Typography color="text.secondary">No products match this search.</Typography></Grid>}
    </Grid>}
    <Box ref={sentinelRef} aria-hidden="true" sx={{ height: 1 }} />
    {hasMore && <Button variant="outlined" onClick={() => void loadMore()} disabled={loading} sx={{ alignSelf: "center", minWidth: 180 }}>{loading ? "Loading…" : "Load more products"}</Button>}
    {!hasMore && products.length > 0 && <Typography textAlign="center" color="text.secondary" variant="body2">You have reached the end of the catalogue.</Typography>}
  </Stack>;
}
