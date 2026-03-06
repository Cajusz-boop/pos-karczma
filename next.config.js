const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const isCapacitorBuild = process.env.CAPACITOR_BUILD === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isCapacitorBuild ? 'export' : 'standalone',
  compress: true,
  poweredByHeader: false,

  eslint: {
    ignoreDuringBuilds: isCapacitorBuild,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  experimental: isCapacitorBuild
    ? {
        optimizePackageImports: [
          'lucide-react',
          '@tanstack/react-query',
          'date-fns',
          'zod',
        ],
      }
    : {
        serverActions: { bodySizeLimit: '2mb' },
        optimizePackageImports: [
          'lucide-react',
          '@tanstack/react-query',
          'date-fns',
          'zod',
        ],
      },

  images: {
    unoptimized: isCapacitorBuild,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24,
  },

  headers: isCapacitorBuild ? undefined : async () => [
    {
      source: '/api/products',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
      ],
    },
    {
      source: '/api/categories',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
      ],
    },
    {
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/icon-:size.png',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
      ],
    },
    {
      source: '/manifest.json',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' },
      ],
    },
  ],

  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },

};

module.exports = withBundleAnalyzer(nextConfig);
