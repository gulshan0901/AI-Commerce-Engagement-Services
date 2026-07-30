/** Prevents the authenticated checkout workflow from being indexed. */
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
