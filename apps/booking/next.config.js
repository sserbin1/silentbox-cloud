/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PWA headers for service worker
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
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
  // Custom domain routing (tenants use their own domains, no subdomains)
  async rewrites() {
    return {
      beforeFiles: [
        // Handle custom domains via header (set by reverse proxy like Nginx)
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
