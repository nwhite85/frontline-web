import type { Metadata } from 'next'
import { posts } from '@/content/blog/posts'
import { CategoryFilter } from './CategoryFilter'

export const metadata: Metadata = {
  title: 'Blog | Frontline Fitness',
  description: 'Training tips, outdoor fitness guides, and community stories from Frontline Fitness in Swindon.',
  openGraph: {
    title: 'Blog | Frontline Fitness',
    description: 'Training tips, outdoor fitness guides, and community stories from Frontline Fitness in Swindon.',
    url: 'https://frontlinefitness.co.uk/blog',
  },
  alternates: {
    canonical: 'https://frontlinefitness.co.uk/blog',
  },
}

export default function BlogPage() {
  const sorted = [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Nav */}
      <div className="sticky top-0 z-30 h-16 border-b border-white/10 bg-black">
        <div className="max-w-6xl mx-auto pl-[13px] sm:pl-[21px] lg:pl-[29px] pr-4 sm:pr-6 lg:pr-8 h-full flex items-center">
          <a href="/">
            <img src="/logos/frontline-logo-blue.svg" alt="Frontline Fitness" width="80" height="20" style={{ height: '20px', width: 'auto' }} />
          </a>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 pt-16 pb-12">
        <p className="text-brand-blue text-xs font-semibold uppercase tracking-widest mb-3">Frontline Fitness</p>
        <h1 className="text-4xl sm:text-5xl font-bold uppercase tracking-tight text-white mb-4">
          Training. Mindset.<br />Community.
        </h1>
        <p className="text-white/50 text-lg max-w-xl">
          Practical fitness advice, outdoor training guides, and stories from the Frontline community.
        </p>
      </div>

      {/* Posts */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 sm:px-8 lg:px-12 pb-16">
        <CategoryFilter posts={sorted} />
      </div>

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
