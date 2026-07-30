import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  poweredByHeader: false,
  compress: true,
  images: { remotePatterns: [
    { protocol: "https", hostname: "images.unsplash.com" },
    { protocol: "https", hostname: "cdn.dummyjson.com" },
  ], formats: ["image/avif", "image/webp"], minimumCacheTTL: 86400 },
};

export default nextConfig;
