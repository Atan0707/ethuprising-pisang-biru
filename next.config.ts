import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'plum-tough-mongoose-147.mypinata.cloud',
      'example.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'plum-tough-mongoose-147.mypinata.cloud',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
