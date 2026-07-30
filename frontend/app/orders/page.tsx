"use client";

/** Displays customer purchases, fulfillment progress, tracking, and returns. */

import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import { Alert, Box, Button, Chip, CircularProgress, Container, Divider, Grid, Paper, Stack, Step, StepLabel, Stepper, TextField, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CommerceLayout } from "@/components/CommerceLayout";
import { AuthPanel } from "@/components/AuthPanel";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getOrders, requestReturn, trackOrder } from "@/services/api";
import { Order } from "@/types/order";

const deliverySteps = ["Confirmed", "Shipped", "Delivered"];
const stepByStatus: Record<Order["status"], number> = { pending: 0, confirmed: 0, shipped: 1, delivered: 2, return_requested: 2, returned: 2, cancelled: 0 };

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const { session, loading } = useAuthSession();
  useEffect(() => { if (session) getOrders(session.access_token).then(setOrders).catch((caught) => setError(caught instanceof Error ? caught.message : "Orders unavailable")); }, [session]);
  async function track(id: string) { if (!session) return; try { setNotice((await trackOrder(id, session.access_token)).summary); setError(""); } catch (caught) { setError(caught instanceof Error ? caught.message : "Tracking unavailable"); } }
  async function submitReturn(id: string) { if (!session || (reasons[id] ?? "").trim().length < 5) return; try { const response = await requestReturn(id, reasons[id], session.access_token); setOrders((current) => current.map((order) => order.id === id ? response.order : order)); setNotice(response.message); } catch (caught) { setError(caught instanceof Error ? caught.message : "Return request failed"); } }

  return <CommerceLayout><Container maxWidth="lg" sx={{ py: 7 }}><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "end" }} mb={4}><Box><Typography variant="h2">Your orders</Typography><Typography color="text.secondary">Track deliveries, review purchases, and request returns.</Typography></Box><Button component={Link} href="/products" variant="outlined">Continue shopping</Button></Stack>{notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{loading ? <CircularProgress /> : !session ? <Paper sx={{ p: 4 }}><Typography variant="h5" mb={3}>Sign in to view your orders</Typography><AuthPanel onDemo={() => undefined} /></Paper> : !orders.length ? <Paper sx={{ p: 6, textAlign: "center" }}><Inventory2RoundedIcon color="secondary" sx={{ fontSize: 60 }} /><Typography variant="h4" mt={2}>No orders yet</Typography><Typography color="text.secondary" mb={3}>Your completed purchases will appear here.</Typography><Button component={Link} href="/products" variant="contained">Explore products</Button></Paper> : <Stack spacing={3}>{orders.map((order) => <Paper key={order.id} sx={{ overflow: "hidden" }}><Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2} sx={{ p: 3, background: "linear-gradient(135deg, rgba(124,108,255,.14), rgba(77,226,197,.05))" }}><Box><Typography variant="overline" color="secondary.main">Order #{order.id.slice(0, 8).toUpperCase()}</Typography><Typography color="text.secondary">Placed {new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: "long" })}</Typography></Box><Stack direction="row" spacing={1} alignItems="center"><Chip color={order.status.includes("return") ? "warning" : order.status === "cancelled" ? "error" : "success"} label={order.status.replaceAll("_", " ")} sx={{ textTransform: "capitalize" }} /><Typography variant="h5" fontWeight={900}>${order.total.toLocaleString()}</Typography></Stack></Stack>
          <Grid container><Grid size={{ xs: 12, md: 8 }} sx={{ p: 3 }}><Stepper activeStep={stepByStatus[order.status]} alternativeLabel sx={{ mb: 3 }}>{deliverySteps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper><Divider />
            <Stack divider={<Divider flexItem />}>{order.items.map((item) => <Stack key={item.product_id} direction="row" spacing={2} alignItems="center" py={2}><Box sx={{ width: 76, height: 64, position: "relative", borderRadius: 2, overflow: "hidden", bgcolor: "background.default", flexShrink: 0 }}><Image src={item.image_url} alt={item.name} fill sizes="76px" style={{ objectFit: "cover" }} /></Box><Box flexGrow={1}><Typography fontWeight={800}>{item.name}</Typography><Typography color="text.secondary" variant="body2">Quantity {item.quantity}</Typography></Box><Typography fontWeight={750}>${(item.price * item.quantity).toLocaleString()}</Typography></Stack>)}</Stack></Grid>
            <Grid size={{ xs: 12, md: 4 }} sx={{ p: 3, bgcolor: "rgba(255,255,255,.025)" }}><Stack spacing={2}><Box><Typography variant="subtitle2" color="text.secondary">DELIVERY TO</Typography><Typography fontWeight={800}>{order.delivery_name}</Typography><Typography variant="body2" color="text.secondary">{order.delivery_address}</Typography></Box>{order.tracking_number && <Box><Typography variant="subtitle2" color="text.secondary">TRACKING NUMBER</Typography><Typography fontWeight={800}>{order.tracking_number}</Typography></Box>}<Button variant="outlined" startIcon={<LocalShippingRoundedIcon />} onClick={() => track(order.id)}>Track order</Button>{["confirmed", "shipped", "delivered"].includes(order.status) && <><TextField size="small" multiline minRows={2} placeholder="Why would you like to return this?" value={reasons[order.id] ?? ""} onChange={(event) => setReasons({ ...reasons, [order.id]: event.target.value })} /><Button variant="contained" color="warning" disabled={(reasons[order.id] ?? "").trim().length < 5} onClick={() => submitReturn(order.id)}>Request return</Button></>}{order.return_reason && <Alert severity="warning">Return reason: {order.return_reason}</Alert>}</Stack></Grid></Grid>
        </Paper>)}</Stack>}</Container></CommerceLayout>;
}
