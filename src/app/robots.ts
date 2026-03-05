import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/dashboard-login/', '/client-dashboard/', '/client/', '/api/'],
      },
    ],
    sitemap: 'https://www.frontlinefitness.co.uk/sitemap.xml',
  }
}
