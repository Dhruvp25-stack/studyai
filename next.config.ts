import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow larger request bodies for PDF uploads (default is 1mb, we need up to 10mb)
  experimental: {
    serverActions: {
      bodySizeLimit: '11mb',
    },
  },
};

export default nextConfig;
