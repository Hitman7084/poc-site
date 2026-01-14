import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security configurations
  poweredByHeader: false, // Remove X-Powered-By header
  
  // Strict mode for React
  reactStrictMode: true,
  
  // Disable source maps in production for security
  productionBrowserSourceMaps: false,
  
  // Security headers via Next.js config (backup to proxy headers)
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ],
};

export default nextConfig;
