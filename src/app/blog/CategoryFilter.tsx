'use client'

import { useState } from 'react'
import { BlogPost } from '@/content/blog/posts'

const CATEGORY_COLORS: Record<string, string> = {
  Training: 'bg-brand-blue/10 text-brand-blue border-brand-blue/30',
  Nutrition: 'bg-green-500/10 text-green-400 border-green-500/30',
  Community: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  Lifestyle: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function CategoryFilter({ posts }: { posts: BlogPost[] }) {
  const categories = ['All', ...Array.from(new Set(posts.map(p => p.category)))]
  const [active, setActive] = useState('All')

  const filtered = active === 'All' ? posts : posts.filter(p => p.category === active)

  return (
    <>
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-10">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border transition-colors ${
              active === cat
                ? 'bg-brand-blue border-brand-blue text-white'
                : 'bg-transparent border-white/15 text-white/50 hover:border-white/30 hover:text-white/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Post grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filtered.map(post => (
          <a
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05] transition-all overflow-hidden"
          >
            <div className="p-6 flex flex-col gap-3 flex-1">
              {/* Category badge */}
              <span className={`self-start text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[post.category] ?? 'bg-white/5 text-white/40 border-white/10'}`}>
                {post.category}
              </span>

              {/* Title */}
              <h2 className="text-lg font-bold text-white leading-snug group-hover:text-white transition-colors">
                {post.title}
              </h2>

              {/* Excerpt */}
              <p className="text-white/50 text-sm leading-relaxed flex-1">
                {post.excerpt}
              </p>

              {/* Meta */}
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <span className="text-white/30 text-xs">{formatDate(post.date)}</span>
                <span className="text-white/30 text-xs">{post.readTime}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </>
  )
}
