import type { Metadata } from "next";

export const metadata: Metadata = { title: "Search Products", description: "Search products by name, brand, category, price, and shopping intent." };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
