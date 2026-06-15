import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/Node packages that must NOT be bundled by Next.
  serverExternalPackages: ["@react-pdf/renderer", "sharp"],

  experimental: {
    // Uploaded photos make the form submission larger than the 1MB default.
    // We compress on the client to ~1MB each, so 8mb is plenty of headroom.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;