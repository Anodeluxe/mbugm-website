import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer relies on Node.js APIs and breaks when Next.js tries to
  // bundle it (the infamous "X is not a constructor" error). This opts it out
  // of bundling so it's loaded natively at runtime. THIS LINE IS REQUIRED.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;