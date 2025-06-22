import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
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
  serverExternalPackages: ['sharp', 'onnxruntime-node'],
};

export default nextConfig;
