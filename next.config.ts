import type { NextConfig } from "next";
import path from "path";

// Security headers live in vercel.json: `headers()` in this file is ignored with output: "export".
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  productionBrowserSourceMaps: false,
  turbopack: {
    root: path.resolve(__dirname), // a stray package-lock.json in the home dir confuses root detection
    resolveAlias: {
      canvas: "./lib/empty.ts",
    },
  },
};

export default nextConfig;
