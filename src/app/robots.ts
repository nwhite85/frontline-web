import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/dashboard-login',
          '/client',
          '/client/',
          '/client-dashboard',
          '/api/',
          '/checkout',
          '/signup',
          '/login',
          '/reset-password',
          '/update-password',
          '/founder-merch',
          '/merch',
          '/free-tee',
        ],
      },
    ],
    sitemap: 'https://frontlinefitness.co.uk/sitemap.xml',
  }
}
