/** Generates the public-route sitemap used by search engines. */
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return ["", "/products", "/categories", "/assistant", "/compare", "/support", "/about", "/contact", "/faq"].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "/products" ? "daily" : "weekly", priority: path === "" ? 1 : path === "/products" ? .9 : .7 }));
}
