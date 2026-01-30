/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Enable subdomain routing
  async rewrites() {
    return {
      beforeFiles: [
        // Handle tenant subdomains - rewrite to include tenant slug
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: '(?<tenant>[^.]+)\\.silentbox\\.io',
            },
          ],
          destination: '/:path*?tenant=:tenant',
        },
        // Handle custom domains via header (set by reverse proxy)
        {
          source: '/:path*',
          has: [
            {
              type: 'header',
              key: 'x-tenant-domain',
              value: '(?<domain>.+)',
            },
          ],
          destination: '/:path*?customDomain=:domain',
        },
      ],
    };
  },
};

module.exports = nextConfig;
