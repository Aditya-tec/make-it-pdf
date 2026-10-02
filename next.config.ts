import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    resolveAlias: {
      canvas: "./lib/empty.ts",
    },
  },
};

export default nextConfig;
