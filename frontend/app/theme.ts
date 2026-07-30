"use client";

/** Centralizes accessible colors, typography, responsive styles, and MUI defaults. */

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#7c6cff" },
    secondary: { main: "#4de2c5" },
    background: { default: "#090b13", paper: "#121522" },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "Inter, Segoe UI, Arial, sans-serif",
    h1: { fontWeight: 800, letterSpacing: "-0.04em" },
    h2: { fontWeight: 750, letterSpacing: "-0.03em", "@media (max-width:600px)": { fontSize: "2.25rem", lineHeight: 1.12 } },
    h3: { "@media (max-width:600px)": { fontSize: "1.9rem", lineHeight: 1.18 } },
    h4: { "@media (max-width:600px)": { fontSize: "1.6rem", lineHeight: 1.2 } },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: { styleOverrides: {
      html: { scrollBehavior: "smooth" },
      body: { textRendering: "optimizeLegibility", overflowX: "clip" },
      "*:focus-visible": { outline: "3px solid #4de2c5", outlineOffset: "3px" },
      ".sr-only": { position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 },
      "@media (prefers-reduced-motion: reduce)": { html: { scrollBehavior: "auto" }, "*, *::before, *::after": { animationDuration: "0.01ms !important", animationIterationCount: "1 !important", transitionDuration: "0.01ms !important" } },
    } },
    MuiCard: { styleOverrides: { root: { border: "1px solid rgba(255,255,255,.08)" } } },
    MuiTypography: { defaultProps: { variantMapping: { h1: "h1", h2: "h1", h3: "h2", h4: "h2", h5: "h3", h6: "h3", subtitle1: "p", subtitle2: "p", body1: "p", body2: "p" } } },
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});
