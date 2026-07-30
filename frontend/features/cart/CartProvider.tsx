"use client";

/** Owns persistent browser cart state and exposes safe mutation helpers. */

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Product } from "@/types";

export type CartLine = { product: Product; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  total: number;
  add: (product: Product) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try { setLines(JSON.parse(localStorage.getItem("ace-cart") ?? "[]")); } catch { setLines([]); }
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem("ace-cart", JSON.stringify(lines)); }, [hydrated, lines]);

  const value = useMemo<CartContextValue>(() => ({
    lines,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    total: lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
    add: (product) => setLines((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      return existing
        ? current.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line)
        : [...current, { product, quantity: 1 }];
    }),
    setQuantity: (productId, quantity) => setLines((current) => quantity <= 0 ? current.filter((line) => line.product.id !== productId) : current.map((line) => line.product.id === productId ? { ...line, quantity } : line)),
    remove: (productId) => setLines((current) => current.filter((line) => line.product.id !== productId)),
    clear: () => setLines([]),
  }), [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider");
  return value;
}
