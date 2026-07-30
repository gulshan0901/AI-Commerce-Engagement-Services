"use client";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { Alert, Button, Chip, CircularProgress, Container, Grid, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CommerceLayout } from "@/components/CommerceLayout";
import { AuthPanel } from "@/components/AuthPanel";
import { useCart } from "@/features/cart/CartProvider";
import { useAuthSession } from "@/hooks/useAuthSession";
import { createOrder } from "@/services/api";

export default function CheckoutPage() {
  const { lines, total, clear, remove } = useCart();
  const [form, setForm] = useState({ name: "", email: "", address: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [unavailableIds, setUnavailableIds] = useState<string[]>([]);
  const { session, loading } = useAuthSession();
  const router = useRouter();
  const unavailable = new Set([
    ...unavailableIds,
    ...lines.filter((line) => !line.product.in_stock).map((line) => line.product.id),
  ]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!lines.length || !session || unavailable.size) return;
    setSubmitting(true); setError("");
    try {
      const order = await createOrder(lines, form, session.access_token);
      clear(); router.push(`/orders?created=${order.id}`);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Checkout failed";
      const ids = message.match(/Products are unavailable:\s*(.+)$/i)?.[1]
        .split(",").map((id) => id.trim()).filter(Boolean) ?? [];
      if (ids.length) setUnavailableIds(ids);
      setError(message);
    } finally { setSubmitting(false); }
  }

  function removeItem(productId: string) {
    remove(productId);
    setUnavailableIds((ids) => ids.filter((id) => id !== productId));
    setError("");
  }

  function removeUnavailable() {
    unavailable.forEach(remove);
    setUnavailableIds([]); setError("");
  }

  return <CommerceLayout><Container maxWidth="md" sx={{ py: 7 }}><Typography variant="h2" mb={4}>Checkout</Typography>{loading ? <CircularProgress /> : !session ? <Paper sx={{ p: 4 }}><Typography variant="h5" mb={3}>Sign in to place your order</Typography><AuthPanel onDemo={() => undefined} /></Paper> : !lines.length ? <Alert severity="info">Your cart is empty.</Alert> : <Grid component="form" onSubmit={submit} container spacing={3}>
    <Grid size={{ xs: 12, md: 7 }}><Paper sx={{ p: 3 }}><Stack spacing={2}><Typography variant="h5" fontWeight={850}>Delivery details</Typography><TextField required label="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><TextField required type="email" label="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /><TextField required multiline minRows={3} label="Address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Stack></Paper></Grid>
    <Grid size={{ xs: 12, md: 5 }}><Paper sx={{ p: 3 }}><Stack spacing={2}><Typography variant="h5" fontWeight={850}>Order summary</Typography>
      {lines.map((line) => <Stack key={line.product.id} direction="row" alignItems="center" spacing={1}><Stack flexGrow={1}><Stack direction="row" spacing={1} alignItems="center"><Typography>{line.product.name} × {line.quantity}</Typography>{unavailable.has(line.product.id) && <Chip label="Unavailable" color="error" size="small" />}</Stack><Typography>${(line.product.price * line.quantity).toLocaleString()}</Typography></Stack>{unavailable.has(line.product.id) && <IconButton color="error" onClick={() => removeItem(line.product.id)} aria-label={`Remove unavailable ${line.product.name}`}><DeleteOutlineRoundedIcon /></IconButton>}</Stack>)}
      <Typography variant="h5" fontWeight={900}>Estimated total: ${total.toLocaleString()}</Typography><Alert severity="info">The backend validates stock and recalculates the final total. No payment is collected.</Alert>
      {error && <Alert severity="error" action={unavailable.size ? <Button color="inherit" size="small" onClick={removeUnavailable}>Remove all</Button> : undefined}>{error}</Alert>}
      {unavailable.size > 0 && <Button color="error" variant="outlined" startIcon={<DeleteOutlineRoundedIcon />} onClick={removeUnavailable}>Remove unavailable products</Button>}
      <Button disabled={submitting || unavailable.size > 0} type="submit" size="large" variant="contained">{submitting ? "Placing order…" : unavailable.size ? "Remove unavailable items" : "Place order"}</Button>
    </Stack></Paper></Grid>
  </Grid>}</Container></CommerceLayout>;
}
