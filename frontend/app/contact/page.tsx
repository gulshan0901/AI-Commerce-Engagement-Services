"use client";

import { Alert, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { FormEvent, useState } from "react";
import { CommerceLayout } from "@/components/CommerceLayout";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  function submit(event: FormEvent) { event.preventDefault(); setSent(true); }
  return <CommerceLayout><Container maxWidth="sm" sx={{ py: 8 }}><Typography variant="h2" mb={1}>Contact</Typography><Typography color="text.secondary" mb={4}>Share a question, partnership idea, or product concern.</Typography><Paper component="form" onSubmit={submit} sx={{ p: 3 }}><Stack spacing={2}>{sent && <Alert severity="success">Thanks—this demo captured your message locally.</Alert>}<TextField required label="Name" /><TextField required type="email" label="Email" /><TextField required multiline minRows={5} label="Message" /><Button type="submit" size="large" variant="contained">Send message</Button></Stack></Paper></Container></CommerceLayout>;
}
