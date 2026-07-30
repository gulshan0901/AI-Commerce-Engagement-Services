"use client";

import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import { Alert, Box, Breadcrumbs, Button, Chip, CircularProgress, Container, Divider, Grid, Link as MuiLink, Paper, Rating, Stack, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
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

  if (error) return <CommerceLayout><Container sx={{ py: 7 }}><Alert severity="error">{error}</Alert></Container></CommerceLayout>;
  if (!product) return <CommerceLayout><Container sx={{ py: 7 }}><CircularProgress /></Container></CommerceLayout>;
  const fulfillment = [
    { icon: <LocalShippingRoundedIcon />, title: "Delivery", text: product.specs.Shipping ?? "Standard delivery available" },
    { icon: <VerifiedRoundedIcon />, title: "Warranty", text: product.specs.Warranty ?? "Quality checked" },
    { icon: <ReplayRoundedIcon />, title: "Returns", text: product.specs["Return policy"] ?? "See return policy" },
  ];
  const technicalSpecs = Object.entries(product.specs).filter(([key]) => !["Shipping", "Warranty", "Return policy"].includes(key));

  return <CommerceLayout><Container maxWidth="xl" sx={{ py: 5 }}><Breadcrumbs sx={{ mb: 4 }}><MuiLink component={Link} href="/products" color="text.secondary" underline="hover">Products</MuiLink><MuiLink component={Link} href={`/categories/${product.category}`} color="text.secondary" underline="hover" sx={{ textTransform: "capitalize" }}>{product.category.replaceAll("-", " ")}</MuiLink><Typography color="text.primary">{product.name}</Typography></Breadcrumbs>
    <Grid container spacing={{ xs: 4, md: 7 }}><Grid size={{ xs: 12, md: 6 }}><Paper sx={{ position: { md: "sticky" }, top: 100, overflow: "hidden", bgcolor: "rgba(255,255,255,.025)" }}><Box sx={{ height: { xs: 360, md: 580 }, position: "relative" }}><Image src={product.image_url} alt={product.name} fill priority sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "contain", padding: 24 }} /></Box></Paper></Grid>
      <Grid size={{ xs: 12, md: 6 }}><Stack spacing={3}><Stack direction="row" gap={1} flexWrap="wrap"><Chip color="secondary" label={product.brand} /><Chip variant="outlined" label={product.category.replaceAll("-", " ")} sx={{ textTransform: "capitalize" }} />{product.in_stock && <Chip color="success" label="In stock" />}</Stack><Box><Typography variant="h2">{product.name}</Typography><Stack direction="row" spacing={1} alignItems="center" mt={1}><Rating value={product.rating} precision={0.1} readOnly /><Typography color="text.secondary">{product.rating.toFixed(1)} out of 5</Typography></Stack></Box>
        <Typography variant="h3" fontWeight={950}>${product.price.toLocaleString()}</Typography><Box><Typography variant="h5" fontWeight={850} mb={1}>About this product</Typography><Typography color="text.secondary" fontSize={18} lineHeight={1.75}>{product.description}</Typography><Typography color="text.secondary" mt={1.5} lineHeight={1.7}>Designed by {product.brand} for customers exploring {product.category.replaceAll("-", " ")}, this product combines practical everyday use with the specifications listed below.</Typography></Box>
        {product.tags.length > 0 && <Stack direction="row" gap={1} flexWrap="wrap">{product.tags.map((tag) => <Chip key={tag} label={tag} size="small" variant="outlined" />)}</Stack>}
        <Paper variant="outlined" sx={{ p: 2.5 }}><Stack divider={<Divider flexItem />} spacing={2}>{fulfillment.map((item) => <Stack key={item.title} direction="row" spacing={2} alignItems="center"><Box color="secondary.main">{item.icon}</Box><Box><Typography fontWeight={800}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{item.text}</Typography></Box></Stack>)}</Stack></Paper>
        <Button size="large" variant="contained" disabled={!product.in_stock} startIcon={<AddShoppingCartRoundedIcon />} onClick={() => add(product)} sx={{ py: 1.5 }}>{product.in_stock ? "Add to cart" : "Currently unavailable"}</Button>
      </Stack></Grid></Grid>
    <Paper sx={{ mt: 7, p: { xs: 2.5, md: 4 } }}><Typography variant="h4" fontWeight={900} mb={3}>Product specifications</Typography><Grid container spacing={0}>{technicalSpecs.map(([key, value], index) => <Grid key={key} size={{ xs: 12, md: 6 }}><Stack direction="row" justifyContent="space-between" gap={2} sx={{ p: 2, bgcolor: index % 2 === 0 ? "rgba(255,255,255,.025)" : "transparent", borderBottom: "1px solid rgba(255,255,255,.06)" }}><Typography color="text.secondary">{key}</Typography><Typography fontWeight={750} textAlign="right">{value}</Typography></Stack></Grid>)}</Grid></Paper>
  </Container></CommerceLayout>;
}
