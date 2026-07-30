"use client";

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
    h2: { fontWeight: 750, letterSpacing: "-0.03em" },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiCard: { styleOverrides: { root: { border: "1px solid rgba(255,255,255,.08)" } } },
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});
