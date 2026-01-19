import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/data/:path*",
        destination: "http://localhost:8000/data/:path*",
      },
      {
        source: "/topics",
        destination: "http://localhost:8000/topics",
      },
      {
        source: "/processed-inputs",
        destination: "http://localhost:8000/processed-inputs",
      },
      {
        source: "/playback-contents",
        destination: "http://localhost:8000/playback-contents",
      },
    ];
  },
  transpilePackages: ['tamagui', '@speed-code/shared', 'react-native-svg', 'react-native-reanimated'],
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native$': 'react-native-web',
      'react-native-svg$': 'react-native-svg/lib/commonjs',
    };
    config.resolve.extensions = ['.web.js', '.web.ts', '.web.tsx', ...config.resolve.extensions];
    return config;
  },
};

export default nextConfig;
