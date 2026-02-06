import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Mengubah limit menjadi 50MB
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" } 
    ]
  }
  /* config options here */
};

export default nextConfig;
