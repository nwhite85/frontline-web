import type { MetadataRoute } from 'next'
import { posts } from '@/content/blog/posts'

export const revalidate = 86400 // cache for 24 hours

const BASE = 'https://frontlinefitness.co.uk'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date('2026-04-08'), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/blog`, lastModified: new Date('2026-04-08'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/shop`, lastModified: new Date('2026-04-01'), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/swindon-bootcamp`, lastModified: new Date('2026-04-08'), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/lydiard-park`, lastModified: new Date('2026-04-08'), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/faq`, lastModified: new Date('2026-03-01'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/privacy`, lastModified: new Date('2026-03-01'), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/support`, lastModified: new Date('2026-03-01'), changeFrequency: 'yearly', priority: 0.3 },
  ]

  const blogRoutes: MetadataRoute.Sitemap = [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(post => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...blogRoutes]
}
