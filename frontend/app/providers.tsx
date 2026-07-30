"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "./theme";
import { CartProvider } from "@/features/cart/CartProvider";
import { LazyChatWidget } from "@/components/LazyChatWidget";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}><CssBaseline /><CartProvider>{children}<LazyChatWidget /></CartProvider></ThemeProvider>;
}
