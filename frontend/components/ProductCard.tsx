"use client";

/** Presents a reusable product summary with explanations and cart actions. */

import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { Box, Button, Card, CardContent, Chip, Rating, Stack, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { useCart } from "@/features/cart/CartProvider";

export function ProductCard({ product, reasons = [] }: { product: Product; reasons?: string[] }) {
  const { add } = useCart();
  return (
    <Card sx={{ height: "100%", overflow: "hidden" }}>
      <Box sx={{ height: 180, position: "relative" }}>
        <Image src={product.image_url} alt={product.name} fill sizes="(max-width: 700px) 100vw, 33vw" style={{ objectFit: "cover" }} />
      </Box>
      <CardContent>
        <Typography color="secondary.main" variant="overline">{product.brand}</Typography>
        <Typography variant="h6" fontWeight={750}>{product.name}</Typography>
        <Stack direction="row" alignItems="center" spacing={1} my={1}>
          <Rating value={product.rating} precision={0.1} size="small" readOnly />
          <Typography variant="body2" color="text.secondary">{product.rating}</Typography>
        </Stack>
        <Typography variant="h5" fontWeight={800}>${product.price.toLocaleString()}</Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>{product.description}</Typography>
        <Stack direction="row" gap={0.75} flexWrap="wrap" mt={2}>
          {Object.entries(product.specs).slice(0, 3).map(([key, value]) => <Chip key={key} label={`${key}: ${value}`} size="small" />)}
        </Stack>
        {reasons.length > 0 && <Box mt={2} p={1.5} bgcolor="rgba(77,226,197,.08)" borderRadius={2}>
          <Typography variant="subtitle2" color="secondary.main">Why this fits</Typography>
          {reasons.map((reason) => <Stack key={reason} direction="row" spacing={1} mt={0.5}><CheckCircleOutlineIcon color="secondary" sx={{ fontSize: 18 }} /><Typography variant="body2">{reason}</Typography></Stack>)}
        </Box>}
        <Stack direction="row" spacing={1} mt={2}>
          <Button component={Link} href={`/products/${product.id}`} fullWidth variant="outlined">Details</Button>
          <Button fullWidth variant="contained" onClick={() => add(product)} startIcon={<AddShoppingCartRoundedIcon />}>Add</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
