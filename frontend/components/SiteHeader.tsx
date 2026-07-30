"use client";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { AppBar, Badge, Box, Button, Container, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import Link from "next/link";
import { useCart } from "@/features/cart/CartProvider";

const links = [
  ["Products", "/products"], ["Categories", "/categories"], ["Compare", "/compare"], ["Orders", "/orders"], ["Support", "/support"], ["Analytics", "/analytics"],
];

export function SiteHeader() {
  const { count } = useCart();
  return <AppBar position="sticky" color="transparent" elevation={0} sx={{ backdropFilter: "blur(18px)", bgcolor: "rgba(9,11,19,.82)", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
    <Container maxWidth="xl"><Toolbar disableGutters>
      <Typography component={Link} href="/" color="inherit" sx={{ textDecoration: "none", fontWeight: 950, letterSpacing: "-.04em", mr: 4 }}>ACE<span style={{ color: "#4de2c5" }}>.</span></Typography>
      <Stack direction="row" spacing={0.5} sx={{ display: { xs: "none", md: "flex" }, flexGrow: 1 }}>
        {links.map(([label, href]) => <Button component={Link} href={href} color="inherit" key={href}>{label}</Button>)}
      </Stack>
      <Box flexGrow={{ xs: 1, md: 0 }} />
      <Button component={Link} href="/assistant" variant="contained" startIcon={<AutoAwesomeRoundedIcon />} sx={{ mr: 1 }}>AI Assistant</Button>
      <IconButton component={Link} href="/cart" color="inherit" aria-label={`Cart with ${count} items`}><Badge badgeContent={count} color="secondary"><ShoppingCartOutlinedIcon /></Badge></IconButton>
    </Toolbar></Container>
  </AppBar>;
}
