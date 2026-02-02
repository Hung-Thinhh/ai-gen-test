import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  async headers() {
    return [
      {
        // Apply headers to all routes
        source: '/:path*',
        headers: [
          {
            // Allow embedding in iframes (for Zalo, Messenger in-app browsers)
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // Can also use 'ALLOWALL' if needed
          },
          {
            // Relaxed CSP for in-app browsers
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.zalo.me https://*.facebook.com https://*.messenger.com;",
          },
          {
            // Ensure cookies work in third-party contexts
            key: 'SameSite',
            value: 'None; Secure',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
