"use client";

import { Alert, Button, CircularProgress, Container, Grid, Paper, Stack, TextField, Typography } from "@mui/material";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CommerceLayout } from "@/components/CommerceLayout";
import { AuthPanel } from "@/components/AuthPanel";
import { useCart } from "@/features/cart/CartProvider";
import { useAuthSession } from "@/hooks/useAuthSession";
import { createOrder } from "@/services/api";

export default function CheckoutPage() {
  const { lines, total, clear } = useCart();
  const [form, setForm] = useState({ name: "", email: "", address: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { session, loading } = useAuthSession();
  const router = useRouter();
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!lines.length || !session) return;
    setSubmitting(true); setError("");
    try {
      const order = await createOrder(lines, form, session.access_token);
      clear(); router.push(`/orders?created=${order.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout failed");
    } finally { setSubmitting(false); }
  }
  return <CommerceLayout><Container maxWidth="md" sx={{ py: 7 }}><Typography variant="h2" mb={4}>Checkout</Typography>{loading ? <CircularProgress /> : !session ? <Paper sx={{ p: 4 }}><Typography variant="h5" mb={3}>Sign in to place your order</Typography><AuthPanel onDemo={() => undefined} /></Paper> : !lines.length ? <Alert severity="info">Your cart is empty.</Alert> : <Grid component="form" onSubmit={submit} container spacing={3}>
    <Grid size={{ xs: 12, md: 7 }}><Paper sx={{ p: 3 }}><Stack spacing={2}><Typography variant="h5" fontWeight={850}>Delivery details</Typography><TextField required label="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><TextField required type="email" label="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /><TextField required multiline minRows={3} label="Address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Stack></Paper></Grid>
    <Grid size={{ xs: 12, md: 5 }}><Paper sx={{ p: 3 }}><Stack spacing={2}><Typography variant="h5" fontWeight={850}>Order summary</Typography>{lines.map((line) => <Stack key={line.product.id} direction="row" justifyContent="space-between"><Typography>{line.product.name} × {line.quantity}</Typography><Typography>${(line.product.price * line.quantity).toLocaleString()}</Typography></Stack>)}<Typography variant="h5" fontWeight={900}>Estimated total: ${total.toLocaleString()}</Typography><Alert severity="info">The backend validates stock and recalculates the final total. No payment is collected.</Alert>{error && <Alert severity="error">{error}</Alert>}<Button disabled={submitting} type="submit" size="large" variant="contained">{submitting ? "Placing order…" : "Place order"}</Button></Stack></Paper></Grid>
  </Grid>}</Container></CommerceLayout>;
}
