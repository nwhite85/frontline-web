import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,
  async redirects() {
    // Event pages now live under /events/<slug>. The old addresses have been
    // shared on WhatsApp, so they redirect rather than 404 — keep them.
    const movedEvents = ['christmas-do', 'family-fun-day', 'summer-splashdown']
    return [
      ...movedEvents.flatMap(slug => [
        { source: `/${slug}`, destination: `/events/${slug}`, permanent: true },
        { source: `/${slug}/:path*`, destination: `/events/${slug}/:path*`, permanent: true },
      ]),
      // The Splashdown page was briefly at /splashdown before it moved.
      { source: '/splashdown', destination: '/events/summer-splashdown', permanent: true },
      { source: '/splashdown/success', destination: '/events/summer-splashdown/success', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
