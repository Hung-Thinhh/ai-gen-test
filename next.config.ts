import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove console.log in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Optimize package imports
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material', 'swiper'],
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
  },

  async headers() {
    return [
      {
        // Apply headers to all routes
        source: '/:path*',
        headers: [
          {
            // Allow embedding in iframes (for Zalo, Messenger in-app browsers)
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            // Relaxed CSP for in-app browsers
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.zalo.me https://*.facebook.com https://*.messenger.com;",
          },
          {
            // Security: Strict SameSite to prevent CSRF
            key: 'SameSite',
            value: 'Lax',
          },
        ],
      },
      // Cache static assets
      {
        source: '/img/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
