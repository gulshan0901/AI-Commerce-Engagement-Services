"use client";

import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import { Alert, Box, Button, Chip, CircularProgress, Container, Grid, Rating, Stack, Typography } from "@mui/material";
import Image from "next/image";
import { use, useEffect, useState } from "react";
import { CommerceLayout } from "@/components/CommerceLayout";
import { useCart } from "@/features/cart/CartProvider";
import { getProduct } from "@/services/api";
import { Product } from "@/types";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product>();
  const [error, setError] = useState("");
  const { add } = useCart();
  useEffect(() => { getProduct(id).then(setProduct).catch((caught) => setError(caught instanceof Error ? caught.message : "Product unavailable")); }, [id]);

  return <CommerceLayout><Container sx={{ py: 7 }}>{error ? <Alert severity="error">{error}</Alert> : !product ? <CircularProgress /> : <Grid container spacing={6}>
    <Grid size={{ xs: 12, md: 6 }}><Box sx={{ height: { xs: 320, md: 520 }, position: "relative", borderRadius: 4, overflow: "hidden" }}><Image src={product.image_url} alt={product.name} fill priority sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "cover" }} /></Box></Grid>
    <Grid size={{ xs: 12, md: 6 }}><Stack spacing={2}>
      <Typography color="secondary.main" variant="overline">{product.brand} · {product.category}</Typography>
      <Typography variant="h2">{product.name}</Typography>
      <Stack direction="row" spacing={1} alignItems="center"><Rating value={product.rating} precision={0.1} readOnly /><Typography color="text.secondary">{product.rating}/5</Typography></Stack>
      <Typography variant="h3" fontWeight={900}>${product.price.toLocaleString()}</Typography>
      <Typography color="text.secondary" fontSize={18}>{product.description}</Typography>
      <Stack direction="row" gap={1} flexWrap="wrap">{Object.entries(product.specs).map(([key, value]) => <Chip key={key} label={`${key}: ${value}`} />)}</Stack>
      <Typography color={product.in_stock ? "secondary.main" : "error.main"}>{product.in_stock ? "In stock and ready to ship" : "Currently unavailable"}</Typography>
      <Button size="large" variant="contained" disabled={!product.in_stock} startIcon={<AddShoppingCartRoundedIcon />} onClick={() => add(product)}>Add to cart</Button>
    </Stack></Grid>
  </Grid>}</Container></CommerceLayout>;
}

