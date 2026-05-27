import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['openai'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
