"use client";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { Box, Button, Container, Divider, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { CommerceLayout } from "@/components/CommerceLayout";
import { useCart } from "@/features/cart/CartProvider";

export default function CartPage() {
  const { lines, total, setQuantity, remove } = useCart();
  return <CommerceLayout><Container maxWidth="md" sx={{ py: 7 }}><Typography variant="h2" mb={4}>Your cart</Typography>
    {!lines.length ? <Paper sx={{ p: 5, textAlign: "center" }}><Typography variant="h5">Your cart is empty</Typography><Button component={Link} href="/products" sx={{ mt: 2 }} variant="contained">Browse products</Button></Paper> : <Stack spacing={2}>
      {lines.map(({ product, quantity }) => <Paper key={product.id} sx={{ p: 2 }}><Stack direction="row" spacing={2} alignItems="center"><Box sx={{ width: 90, height: 75, position: "relative", borderRadius: 2, overflow: "hidden", flexShrink: 0 }}><Image src={product.image_url} alt="" fill sizes="90px" style={{ objectFit: "cover" }} /></Box><Box flexGrow={1}><Typography fontWeight={850}>{product.name}</Typography><Typography color="text.secondary">${product.price.toLocaleString()}</Typography></Box><TextField label="Qty" type="number" size="small" value={quantity} onChange={(event) => setQuantity(product.id, Number(event.target.value))} inputProps={{ min: 1 }} sx={{ width: 85 }} /><IconButton onClick={() => remove(product.id)} aria-label={`Remove ${product.name}`}><DeleteOutlineRoundedIcon /></IconButton></Stack></Paper>)}
      <Paper sx={{ p: 3 }}><Stack spacing={2}><Stack direction="row" justifyContent="space-between"><Typography variant="h5">Subtotal</Typography><Typography variant="h5" fontWeight={900}>${total.toLocaleString()}</Typography></Stack><Divider /><Typography color="text.secondary">Shipping and taxes are calculated at checkout.</Typography><Button component={Link} href="/checkout" size="large" variant="contained">Continue to checkout</Button></Stack></Paper>
    </Stack>}
  </Container></CommerceLayout>;
}

