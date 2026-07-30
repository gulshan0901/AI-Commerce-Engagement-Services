"use client";

import { Alert, Box, CircularProgress, Container, Grid, Paper, Stack, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CommerceLayout } from "@/components/CommerceLayout";
import { getCategorySummaries } from "@/services/api";
import type { CategorySummary } from "@/types";

function label(slug: string) {
  return slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    getCategorySummaries().then(setCategories).catch((caught) => setError(caught instanceof Error ? caught.message : "Categories unavailable"));
  }, []);

  return <CommerceLayout><Container maxWidth="xl" sx={{ py: 7 }}><Typography variant="h2" mb={1}>Shop by category</Typography><Typography color="text.secondary" mb={4}>Browse every category available in the Supabase product catalogue.</Typography>
    {error && <Alert severity="error">{error}</Alert>}
    {!categories.length && !error ? <CircularProgress /> : <Grid container spacing={2}>{categories.map((category) => <Grid key={category.slug} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}><Paper component={Link} href={`/categories/${encodeURIComponent(category.slug)}`} sx={{ display: "block", height: "100%", overflow: "hidden", color: "inherit", textDecoration: "none", transition: ".2s", "&:hover": { transform: "translateY(-4px)", borderColor: "primary.main" } }}><Box sx={{ height: 180, position: "relative", bgcolor: "background.default" }}><Image src={category.image_url} alt={label(category.slug)} fill sizes="(max-width: 600px) 100vw, 25vw" style={{ objectFit: "cover" }} /></Box><Stack spacing={0.75} sx={{ p: 2.5 }}><Typography variant="h5" fontWeight={850}>{label(category.slug)}</Typography><Typography color="text.secondary" variant="body2">{category.product_count} products</Typography></Stack></Paper></Grid>)}</Grid>}
  </Container></CommerceLayout>;
}
