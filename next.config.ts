import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  webpack(config, { isServer }) {
    if (isServer) {
        config.externals.push("onnxruntime-node");
      }
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    config.externalsPresets = { node: true };
    config.externals = config.externals || [];
    config.externals.push({
      "@prisma/client": "commonjs @prisma/client"
    });

    config.resolve.alias["@prisma/client"] = path.resolve(
      __dirname,
      "lib/generated/prisma"
    );

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
