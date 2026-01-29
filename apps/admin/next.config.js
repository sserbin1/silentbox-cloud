/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@silentbox/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

module.exports = nextConfig;
