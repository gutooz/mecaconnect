import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  // Playwright tem binários nativos — não pode ser bundlado pelo webpack
  serverExternalPackages: ["playwright", "playwright-core", "playwright-extra", "playwright-extra-plugin-stealth"],
};

export default nextConfig;
