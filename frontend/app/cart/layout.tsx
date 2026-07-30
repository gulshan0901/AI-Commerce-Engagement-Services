/** Prevents user-specific cart state from being indexed by search engines. */
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shopping Cart", robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
