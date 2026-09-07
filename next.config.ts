import type { NextConfig } from "next";

// GitHub Pages serves a project site under a subpath (e.g. /high-assurance-updates).
// The deploy workflow sets NEXT_PUBLIC_BASE_PATH; local dev leaves it empty so
// the site works at the root of localhost:3000.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Fully static export -> ./out, hostable on GitHub Pages (see docs/ARCHITECTURE.md ADR-1).
  output: "export",
  // Routes resolve as dir/index.html, which Pages serves without rewrites.
  trailingSlash: true,
  basePath,
  // Static export cannot run the default image optimizer.
  images: { unoptimized: true },
  // Allow the Tailscale hostname to reach the dev server's HMR/asset endpoints
  // (Next 16 blocks cross-origin dev requests by default). Dev-only; ignored by
  // the static export/build.
  allowedDevOrigins: ["dev.tail05df27.ts.net"],
};

export default nextConfig;
