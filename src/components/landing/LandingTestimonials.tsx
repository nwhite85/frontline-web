'use client'

import { useLandingTheme } from '@/contexts/LandingThemeContext'

interface Testimonial {
  quote: string
  name: string
  initials: string
  memberSince: string
}

const testimonials: Testimonial[] = [
  {
    quote: "The trainers here are incredible. I've seen amazing results in just 3 months and feel stronger than ever before.",
    name: 'Sarah Anderson',
    initials: 'SA',
    memberSince: 'Member since 2023',
  },
  {
    quote: "Best fitness decision I've ever made. The community here is supportive and the workouts are challenging but achievable.",
    name: 'Mike Johnson',
    initials: 'MJ',
    memberSince: 'Member since 2022',
  },
  {
    quote: "I never thought I'd enjoy working out this much. The variety in classes keeps things interesting and fun.",
    name: 'Emma Chen',
    initials: 'EC',
    memberSince: 'Member since 2024',
  },
]

export function LandingTestimonials() {
  const { isDark } = useLandingTheme()

  return (
    <section className={`py-24 ${isDark ? 'bg-[#0e0e0e]' : 'bg-[#f8f9fa]'}`}>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-12">
          <p className="text-brand-blue text-sm font-semibold uppercase tracking-widest mb-3">
            TESTIMONIALS
          </p>
          <h2 className={`text-4xl sm:text-5xl font-bold uppercase ${isDark ? 'text-white' : 'text-[#0f0f0f]'}`}>
            What Members Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`rounded-xl p-6 flex flex-col ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-black/5'}`}
            >
              <div className="text-brand-blue text-5xl font-serif leading-none mb-3 select-none">&ldquo;</div>
              <p className={`text-sm leading-relaxed flex-1 mb-6 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                {t.quote}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-blue flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                  {t.initials}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-[#0f0f0f]'}`}>{t.name}</p>
                  <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{t.memberSince}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
