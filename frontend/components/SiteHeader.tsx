"use client";

/** Renders responsive primary navigation, assistant access, and cart status. */

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { AppBar, Badge, Box, Button, Container, Drawer, IconButton, List, ListItemButton, ListItemText, Stack, Toolbar, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/features/cart/CartProvider";

const links = [
  ["Products", "/products"], ["Categories", "/categories"], ["Compare", "/compare"], ["Orders", "/orders"], ["Support", "/support"], ["Analytics", "/analytics"],
];

export function SiteHeader() {
  const { count } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <AppBar component="header" position="sticky" color="transparent" elevation={0} sx={{ backdropFilter: "blur(18px)", bgcolor: "rgba(9,11,19,.9)", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
    <Container maxWidth="xl"><Toolbar disableGutters>
      <Typography component={Link} href="/" aria-label="ACE home" color="inherit" sx={{ textDecoration: "none", fontWeight: 950, letterSpacing: "-.04em", mr: 4 }}>ACE<span aria-hidden="true" style={{ color: "#4de2c5" }}>.</span></Typography>
      <Stack component="nav" aria-label="Primary navigation" direction="row" spacing={0.5} sx={{ display: { xs: "none", md: "flex" }, flexGrow: 1 }}>
        {links.map(([label, href]) => <Button component={Link} href={href} color="inherit" aria-current={pathname.startsWith(href) ? "page" : undefined} key={href}>{label}</Button>)}
      </Stack>
      <Box flexGrow={{ xs: 1, md: 0 }} />
      <Button component="a" href="https://gulashan.vercel.app/" target="_blank" rel="noopener noreferrer" color="secondary" variant="outlined" endIcon={<OpenInNewRoundedIcon />} aria-label="View Gulshan's portfolio in a new tab" sx={{ mr: 1, display: { xs: "none", lg: "inline-flex" }, whiteSpace: "nowrap" }}>Gulshan</Button>
      <Button component={Link} href="/assistant" variant="contained" startIcon={<AutoAwesomeRoundedIcon />} sx={{ mr: 1, display: { xs: "none", sm: "inline-flex" } }}>AI Assistant</Button>
      <IconButton component={Link} href="/cart" color="inherit" aria-label={`Shopping cart with ${count} ${count === 1 ? "item" : "items"}`}><Badge badgeContent={count} color="secondary"><ShoppingCartOutlinedIcon /></Badge></IconButton>
      <IconButton onClick={() => setOpen(true)} color="inherit" aria-label="Open navigation menu" aria-expanded={open} aria-controls="mobile-navigation" sx={{ display: { md: "none" }, ml: .5 }}><MenuRoundedIcon /></IconButton>
    </Toolbar></Container>
    <Drawer id="mobile-navigation" anchor="right" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: "min(86vw, 340px)", p: 2 } }}><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h6" fontWeight={900}>Navigation</Typography><IconButton onClick={() => setOpen(false)} aria-label="Close navigation menu"><CloseRoundedIcon /></IconButton></Stack><List component="nav" aria-label="Mobile navigation">{links.map(([label, href]) => <ListItemButton component={Link} href={href} selected={pathname.startsWith(href)} onClick={() => setOpen(false)} key={href}><ListItemText primary={label} /></ListItemButton>)}<ListItemButton component={Link} href="/assistant" selected={pathname.startsWith("/assistant")} onClick={() => setOpen(false)}><ListItemText primary="AI Assistant" /></ListItemButton><ListItemButton component="a" href="https://gulashan.vercel.app/" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} sx={{ mt: 1, border: "1px solid", borderColor: "secondary.main", borderRadius: 2 }}><ListItemText primary="Meet Gulshan" secondary="View portfolio ↗" primaryTypographyProps={{ color: "secondary.main", fontWeight: 850 }} /></ListItemButton></List></Drawer>
  </AppBar>;
}
