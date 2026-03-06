import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { posts } from '@/content/blog/posts'
import { ArrowLeft } from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
  Training: 'bg-brand-blue/10 text-brand-blue border-brand-blue/30',
  Nutrition: 'bg-green-500/10 text-green-400 border-green-500/30',
  Community: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  Lifestyle: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function generateStaticParams() {
  return posts.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = posts.find(p => p.slug === slug)
  if (!post) return {}
  return {
    title: `${post.title} | Frontline Fitness`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://frontlinefitness.co.uk/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
    alternates: {
      canonical: `https://frontlinefitness.co.uk/blog/${post.slug}`,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = posts.find(p => p.slug === slug)
  if (!post) notFound()

  const related = posts.filter(p => p.slug !== post.slug).slice(0, 3)

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://frontlinefitness.co.uk' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://frontlinefitness.co.uk/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://frontlinefitness.co.uk/blog/${post.slug}` },
    ],
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    author: { '@type': 'Person', name: post.author },
    datePublished: post.date,
    publisher: {
      '@type': 'Organization',
      name: 'Frontline Fitness',
      url: 'https://frontlinefitness.co.uk',
    },
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      {/* Nav */}
      <div className="sticky top-0 z-30 h-16 border-b border-white/10 bg-black">
        <div className="max-w-6xl mx-auto pl-[13px] sm:pl-[21px] lg:pl-[29px] pr-4 sm:pr-6 lg:pr-8 h-full flex items-center">
          <a href="/">
            <img src="/logos/frontline-logo-blue.svg" alt="Frontline Fitness" width="80" height="20" style={{ height: '20px', width: 'auto' }} />
          </a>
        </div>
      </div>

      {/* Article */}
      <article className="flex-1 max-w-2xl mx-auto w-full px-6 sm:px-8 py-12">
        {/* Back */}
        <a href="/blog" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors mb-8">
          <ArrowLeft size={14} />
          Back to blog
        </a>

        {/* Category */}
        <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border mb-4 ${CATEGORY_COLORS[post.category] ?? 'bg-white/5 text-white/40 border-white/10'}`}>
          {post.category}
        </span>

        {/* Title */}
        <h1 className="text-4xl font-bold uppercase tracking-tight text-white leading-tight mb-4">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-white/30 text-sm mb-10 pb-8 border-b border-white/[0.08]">
          <span>{post.author}</span>
          <span>·</span>
          <span>{formatDate(post.date)}</span>
          <span>·</span>
          <span>{post.readTime}</span>
        </div>

        {/* Content */}
        <div
          className="[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:text-white/60 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-white/60 [&_ul]:mb-4 [&_li]:mb-1.5"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA */}
        <div className="mt-12 rounded-xl border border-brand-blue/20 bg-brand-blue/5 px-6 py-6 text-center">
          <p className="text-white font-semibold mb-1">Ready to get started?</p>
          <p className="text-white/50 text-sm mb-4">Your first session is free — no commitment needed.</p>
          <a href="/#booking" className="inline-flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue/85 text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors">
            Book a free trial
          </a>
        </div>
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <div className="border-t border-white/[0.08] py-12">
          <div className="max-w-2xl mx-auto px-6 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-6">More articles</p>
            <div className="flex flex-col gap-4">
              {related.map(p => (
                <a key={p.slug} href={`/blog/${p.slug}`} className="group flex flex-col gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] transition-all px-5 py-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">{p.category}</span>
                  <span className="text-sm font-semibold text-white group-hover:text-white/90">{p.title}</span>
                  <span className="text-xs text-white/30">{p.readTime}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="h-14 border-t border-white/10">
        <div className="max-w-6xl mx-auto pl-[13px] sm:pl-[21px] lg:pl-[29px] pr-4 sm:pr-6 lg:pr-8 h-full flex items-center gap-6">
          <span className="text-xs text-white/30">© Frontline Fitness</span>
          <a href="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">Privacy &amp; Terms</a>
        </div>
      </div>
    </div>
  )
}
