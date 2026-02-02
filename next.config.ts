import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  httpAgentOptions: {
    keepAlive: true,
  },
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
