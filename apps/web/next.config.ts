import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Os pacotes do workspace publicam TypeScript cru, sem build step.
  transpilePackages: ["@repo/api", "@repo/core"],
};

export default nextConfig;
