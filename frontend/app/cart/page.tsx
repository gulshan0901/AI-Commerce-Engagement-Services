"use client";

/** Renders responsive cart lines, quantity controls, and checkout navigation. */

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { Box, Button, Container, Divider, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { CommerceLayout } from "@/components/CommerceLayout";
import { useCart } from "@/features/cart/CartProvider";

export default function CartPage() {
  const { lines, total, setQuantity, remove } = useCart();
  return <CommerceLayout><Container maxWidth="md" sx={{ py: { xs: 4, md: 7 } }}><Typography variant="h2" mb={{ xs: 3, md: 4 }}>Your cart</Typography>
    {!lines.length ? <Paper sx={{ p: { xs: 3, md: 5 }, textAlign: "center" }}><Typography variant="h5">Your cart is empty</Typography><Button component={Link} href="/products" sx={{ mt: 2 }} variant="contained">Browse products</Button></Paper> : <Stack spacing={2}>
      {lines.map(({ product, quantity }) => <Paper key={product.id} sx={{ p: { xs: 1.5, sm: 2 } }}><Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}><Stack direction="row" spacing={2} alignItems="center" flexGrow={1} minWidth={0}><Box sx={{ width: { xs: 72, sm: 90 }, height: { xs: 64, sm: 75 }, position: "relative", borderRadius: 2, overflow: "hidden", flexShrink: 0 }}><Image src={product.image_url} alt={product.name} fill sizes="(max-width: 600px) 72px, 90px" style={{ objectFit: "cover" }} /></Box><Box minWidth={0}><Typography fontWeight={850} sx={{ overflowWrap: "anywhere" }}>{product.name}</Typography><Typography color="text.secondary">${product.price.toLocaleString()}</Typography></Box></Stack><Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between"><TextField label="Quantity" type="number" size="small" value={quantity} onChange={(event) => setQuantity(product.id, Number(event.target.value))} inputProps={{ min: 1 }} sx={{ width: 110 }} /><IconButton onClick={() => remove(product.id)} aria-label={`Remove ${product.name}`}><DeleteOutlineRoundedIcon /></IconButton></Stack></Stack></Paper>)}
      <Paper sx={{ p: { xs: 2, md: 3 } }}><Stack spacing={2}><Stack direction="row" justifyContent="space-between" gap={2}><Typography variant="h5">Subtotal</Typography><Typography variant="h5" fontWeight={900}>${total.toLocaleString()}</Typography></Stack><Divider /><Typography color="text.secondary">Shipping and taxes are calculated at checkout.</Typography><Button component={Link} href="/checkout" size="large" variant="contained">Continue to checkout</Button></Stack></Paper>
    </Stack>}
  </Container></CommerceLayout>;
}
