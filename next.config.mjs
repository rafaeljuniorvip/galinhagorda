/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'galinhagorda.vip',
      },
    ],
  },
  compress: true,
};

export default nextConfig;
