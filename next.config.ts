import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure Prisma engines from custom output are included in Serverless functions
  outputFileTracingIncludes: {
    "/api/**": ["./src/generated/prisma/**"],
  },
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
