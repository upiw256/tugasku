import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  output: 'standalone',
  staticPageGenerationTimeout: 1000,
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
};

export default withPWA(nextConfig);
