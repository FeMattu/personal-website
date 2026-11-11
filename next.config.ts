import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

// CDN / S3 host that serves stored images (photos, covers). Configured by env, never hard-coded.
const cdnUrl = process.env.STORAGE_PUBLIC_BASE_URL
const cdnHost = cdnUrl ? new URL(cdnUrl) : undefined

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Local media route + the CDN host (remotePatterns is only for next/image's default loader;
    // the photo grid uses the custom CDN loader in src/lib/photos/loader.ts).
    localPatterns: [{ pathname: '/api/media/**' }, { pathname: '/**' }],
    remotePatterns: cdnHost
      ? [
          {
            protocol: cdnHost.protocol.replace(':', '') as 'http' | 'https',
            hostname: cdnHost.hostname,
            ...(cdnHost.port ? { port: cdnHost.port } : {}),
          },
        ]
      : [],
    minimumCacheTTL: 31_536_000,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
}

export default createNextIntlPlugin('./src/i18n/request.ts')(nextConfig)
