"use client";

import { Alert, Button, Chip, CircularProgress, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { CommerceLayout } from "@/components/CommerceLayout";
import { AuthPanel } from "@/components/AuthPanel";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getOrders, requestReturn, trackOrder } from "@/services/api";
import { Order } from "@/types/order";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const { session, loading } = useAuthSession();
  useEffect(() => { if (session) getOrders(session.access_token).then(setOrders).catch((caught) => setError(caught instanceof Error ? caught.message : "Orders unavailable")); }, [session]);
  async function track(id: string) {
    if (!session) return;
    try { setNotice((await trackOrder(id, session.access_token)).summary); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Tracking unavailable"); }
  }
  async function submitReturn(id: string) {
    if (!session || (reasons[id] ?? "").trim().length < 5) return;
    try {
      const response = await requestReturn(id, reasons[id], session.access_token);
      setOrders((current) => current.map((order) => order.id === id ? response.order : order));
      setNotice(response.message);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Return request failed"); }
  }
  return <CommerceLayout><Container maxWidth="md" sx={{ py: 7 }}><Typography variant="h2" mb={4}>Orders</Typography>{notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}{loading ? <CircularProgress /> : !session ? <Paper sx={{ p: 4 }}><Typography variant="h5" mb={3}>Sign in to view your orders</Typography><AuthPanel onDemo={() => undefined} /></Paper> : error ? <Alert severity="error">{error}</Alert> : !orders.length ? <Alert severity="info">No orders yet. Complete checkout to create one.</Alert> : <Stack spacing={2}>{orders.map((order) => <Paper key={order.id} sx={{ p: 3 }}><Stack direction="row" justifyContent="space-between" alignItems="start"><Stack><Typography variant="h6" fontWeight={850}>{order.id}</Typography><Typography color="text.secondary">{new Date(order.created_at).toLocaleString()} · {order.items.length} item types</Typography></Stack><Chip color={order.status === "return_requested" ? "warning" : "success"} label={order.status.replace("_", " ")} /></Stack><Typography variant="h5" fontWeight={900} mt={2}>${order.total.toLocaleString()}</Typography><Stack direction={{ xs: "column", sm: "row" }} spacing={1} mt={2}><Button variant="outlined" onClick={() => track(order.id)}>Track order</Button>{["confirmed", "shipped", "delivered"].includes(order.status) && <><TextField size="small" fullWidth placeholder="Reason for return" value={reasons[order.id] ?? ""} onChange={(event) => setReasons({ ...reasons, [order.id]: event.target.value })} /><Button variant="contained" color="warning" disabled={(reasons[order.id] ?? "").trim().length < 5} onClick={() => submitReturn(order.id)}>Request return</Button></>}</Stack>{order.return_reason && <Typography color="text.secondary" mt={2}>Return reason: {order.return_reason}</Typography>}</Paper>)}</Stack>}</Container></CommerceLayout>;
}
