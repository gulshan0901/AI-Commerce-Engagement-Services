import { Box, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { SiteHeader } from "./SiteHeader";

export function CommerceLayout({ children }: { children: React.ReactNode }) {
  return <>
    <Box component="a" href="#main-content" sx={{ position: "fixed", zIndex: 9999, top: 8, left: 8, transform: "translateY(-150%)", bgcolor: "secondary.main", color: "#07110f", px: 2, py: 1, borderRadius: 1, fontWeight: 800, "&:focus": { transform: "translateY(0)" } }}>Skip to main content</Box>
    <SiteHeader />
    <Box component="main" id="main-content" tabIndex={-1}>{children}</Box>
    <Box component="footer" mt={10} py={5} borderTop="1px solid rgba(255,255,255,.08)"><Container><Stack spacing={2}><Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}><Typography fontWeight={900}>ACE Platform</Typography><Stack component="nav" aria-label="Footer navigation" direction="row" spacing={3}><Typography component={Link} href="/about" color="text.secondary">About</Typography><Typography component={Link} href="/contact" color="text.secondary">Contact</Typography></Stack></Stack><Typography variant="body2" color="text.secondary">© {new Date().getFullYear()} ACE Platform. All rights reserved. Powered by <Typography component="a" href="https://gulashan.vercel.app/" target="_blank" rel="noopener noreferrer" color="secondary.main" fontWeight={700} sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>Gulshan<span className="sr-only"> (opens in a new tab)</span></Typography></Typography></Stack></Container></Box>
  </>;
}
