import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remotion packages (bundler, renderer, lambda) use native Node.js binaries
  // that must NOT be processed by Next.js/Turbopack. Mark as external.
  serverExternalPackages: [
    "remotion",
    "@remotion/bundler",
    "@remotion/renderer",
    "@remotion/lambda",
    "@remotion/cli",
    "music-metadata",
  ],
  // Silence the turbopack warning (we are not using custom webpack config)
  turbopack: {},
};

export default nextConfig;
