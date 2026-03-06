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
          '/api/',
          '/checkout',
          '/signup',
        ],
      },
    ],
    sitemap: 'https://frontlinefitness.co.uk/sitemap.xml',
  }
}
