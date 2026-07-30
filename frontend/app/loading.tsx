/** Provides an accessible route-level loading indicator during navigation. */
import { Box, LinearProgress } from "@mui/material";

export default function Loading() {
  return <Box role="status" aria-live="polite" aria-label="Loading page" sx={{ minHeight: "60vh" }}><LinearProgress color="secondary" /><span className="sr-only">Loading…</span></Box>;
}
