import type { NextConfig } from "next";
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";
const nextConfig: NextConfig = {
  webpack(config, { isServer }) {
    if (isServer) {
        config.externals.push("onnxruntime-node");
        config.plugins = [...config.plugins, new PrismaPlugin()];
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
  serverExternalPackages: ["onnxruntime-node"]
};

export default nextConfig;
