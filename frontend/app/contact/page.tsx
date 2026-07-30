"use client";

/** Presents contact channels and validates the client-side inquiry form. */

import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import { Alert, Box, Button, Container, Grid, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { CommerceLayout } from "@/components/CommerceLayout";

const channels = [
  { icon: <ForumRoundedIcon />, title: "AI support", copy: "Get immediate, policy-grounded answers.", action: "Open support", href: "/support" },
  { icon: <EmailRoundedIcon />, title: "Email us", copy: "hello@ace-commerce.demo", action: "Send a message", href: "mailto:hello@ace-commerce.demo" },
  { icon: <AccessTimeRoundedIcon />, title: "Response time", copy: "Human inquiries are reviewed within one business day.", action: "", href: "" },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", topic: "Product question", message: "" });
  function submit(event: FormEvent) { event.preventDefault(); setSent(true); setForm({ name: "", email: "", topic: "Product question", message: "" }); }
  return <CommerceLayout><Box sx={{ background: "radial-gradient(circle at 8% 20%, rgba(77,226,197,.13), transparent 30%), radial-gradient(circle at 90% 10%, rgba(124,108,255,.2), transparent 35%)" }}><Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}><Stack alignItems="center" textAlign="center" mb={5}><SupportAgentRoundedIcon color="secondary" sx={{ fontSize: 50 }} /><Typography variant="h2" mt={1}>Let’s start a conversation</Typography><Typography color="text.secondary" fontSize={18} maxWidth={650}>Questions about a product, order, partnership, or the ACE platform? Choose the channel that works best for you.</Typography></Stack>
    <Grid container spacing={3}><Grid size={{ xs: 12, md: 5 }}><Stack spacing={2}>{channels.map((channel) => <Paper key={channel.title} sx={{ p: 3 }}><Stack direction="row" spacing={2}><Box sx={{ width: 46, height: 46, display: "grid", placeItems: "center", borderRadius: 3, bgcolor: "rgba(77,226,197,.1)", color: "secondary.main", flexShrink: 0 }}>{channel.icon}</Box><Box><Typography variant="h6" fontWeight={900}>{channel.title}</Typography><Typography color="text.secondary" variant="body2" lineHeight={1.6}>{channel.copy}</Typography>{channel.action && <Button component={Link} href={channel.href} size="small" sx={{ px: 0, mt: 0.5 }}>{channel.action}</Button>}</Box></Stack></Paper>)}<Paper sx={{ p: 3, background: "linear-gradient(145deg, rgba(124,108,255,.18), rgba(77,226,197,.06))" }}><Typography variant="h5" fontWeight={900}>Already placed an order?</Typography><Typography color="text.secondary" my={1}>Track delivery status or request a return from your order history.</Typography><Button component={Link} href="/orders" variant="outlined">View orders</Button></Paper></Stack></Grid>
      <Grid size={{ xs: 12, md: 7 }}><Paper component="form" onSubmit={submit} sx={{ p: { xs: 2.5, md: 4 } }}><Typography variant="h4" fontWeight={900}>Send us a message</Typography><Typography color="text.secondary" mb={3}>Tell us a little about what you need.</Typography><Stack spacing={2}>{sent && <Alert severity="success" onClose={() => setSent(false)}>Thanks! Your demo message was captured successfully.</Alert>}<Grid container spacing={2}><Grid size={{ xs: 12, sm: 6 }}><TextField required fullWidth label="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Grid><Grid size={{ xs: 12, sm: 6 }}><TextField required fullWidth type="email" label="Email address" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Grid></Grid><TextField select fullWidth label="How can we help?" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })}>{["Product question", "Order support", "Return or refund", "Partnership", "Technical issue", "Other"].map((topic) => <MenuItem key={topic} value={topic}>{topic}</MenuItem>)}</TextField><TextField required multiline minRows={6} label="Your message" placeholder="Include any helpful details, such as an order ID or product name." value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /><Button type="submit" size="large" variant="contained" endIcon={<SendRoundedIcon />}>Send message</Button><Typography variant="caption" color="text.secondary">This portfolio demo stores no contact submission outside your current browser session.</Typography></Stack></Paper></Grid></Grid>
  </Container></Box></CommerceLayout>;
}
