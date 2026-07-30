import { Box, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { SiteHeader } from "./SiteHeader";

export function CommerceLayout({ children }: { children: React.ReactNode }) {
  return <><SiteHeader />{children}<Box component="footer" mt={10} py={5} borderTop="1px solid rgba(255,255,255,.08)"><Container><Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}><Typography fontWeight={900}>ACE Platform</Typography><Stack direction="row" spacing={3}><Typography component={Link} href="/about" color="text.secondary">About</Typography><Typography component={Link} href="/contact" color="text.secondary">Contact</Typography></Stack></Stack></Container></Box></>;
}
