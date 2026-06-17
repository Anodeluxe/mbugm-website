import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/Node packages that must NOT be bundled by Next.
  serverExternalPackages: ["@react-pdf/renderer", "sharp"],

  // sharp's native binary + libvips .so live in platform-specific @img/* packages.
  // Next's tracer doesn't follow them when sharp is externalized, so force them
  // into the serverless bundle. Globs resolve on the Vercel build machine
  // (linux-x64), where these packages are installed; on other platforms they
  // simply match nothing.
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },

  experimental: {
    // Uploaded photos make the form submission larger than the 1MB default.
    // We compress on the client to ~1MB each, so 8mb is plenty of headroom.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;