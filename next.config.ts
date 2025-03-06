import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'plum-tough-mongoose-147.mypinata.cloud',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'plum-tough-mongoose-147.mypinata.cloud',
        pathname: '/ipfs/**',
      },
    ],
  },
};

export default nextConfig;
