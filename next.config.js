const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query',
      'date-fns',
      'zod',
    ],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24,
  },

  headers: async () => [
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
