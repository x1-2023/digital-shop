import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Enable standalone output for Docker
  output: 'standalone',

  // Logging configuration
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  // On-demand entries optimization
  onDemandEntries: {
    maxInactiveAge: 30 * 1000,
    pagesBufferLength: 5,
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.vietqr.io',
        pathname: '/image/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  },

  // Compression
  compress: true,

  // Production optimizations
  poweredByHeader: false,
  generateEtags: true,

  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // ESLint config - disable warnings during build
  eslint: {
    ignoreDuringBuilds: false,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  // Disable static optimization for pages with dynamic content
  // This prevents "Event handlers cannot be passed to Client Component props" errors during build
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
