/** Defines global metadata, structured data, viewport behavior, and providers. */
import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#090b13", colorScheme: "dark" };

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "ACE | AI-Powered Shopping Assistant", template: "%s | ACE" },
  description: "Discover, compare, and buy products with Emma, an explainable AI shopping assistant offering voice, visual search, order help, and personalized recommendations.",
  applicationName: "ACE Platform",
  keywords: ["AI shopping assistant", "product recommendations", "visual product search", "voice commerce", "product comparison"],
  authors: [{ name: "Gulshan", url: "https://gulashan.vercel.app/" }],
  creator: "Gulshan",
  openGraph: { type: "website", locale: "en_US", url: "/", siteName: "ACE Platform", title: "ACE | AI-Powered Shopping Assistant", description: "Find the right product and understand why with Emma, your AI shopping assistant." },
  twitter: { card: "summary_large_image", title: "ACE | AI-Powered Shopping Assistant", description: "AI-powered product discovery, comparison, and support." },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  category: "shopping",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = { "@context": "https://schema.org", "@type": "WebSite", name: "ACE Platform", url: siteUrl, description: metadata.description, potentialAction: { "@type": "SearchAction", target: `${siteUrl}/search?q={search_term_string}`, "query-input": "required name=search_term_string" } };
  return <html lang="en"><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><Providers>{children}</Providers></body></html>;
}
