import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma','onnxruntime-node', 'sharp'],
  },
  webpack(config, { isServer }) {
    if (isServer) {
        config.externals.push("onnxruntime-node");
        config.externals.push("@prisma/client");
        config.externals.push("prisma");
        config.externals.push("sharp");
      }
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["onnxruntime-node", "@prisma/client", "prisma"],
};

export default nextConfig;
