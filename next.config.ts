import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // Suppress hydration warnings from browser extensions
  
  // Allow eval in development for hot reloading
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development' 
              ? "script-src 'self' 'unsafe-eval' 'unsafe-inline';" 
              : "script-src 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
