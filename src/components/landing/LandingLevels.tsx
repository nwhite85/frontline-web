'use client'

import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

const levels = [
  {
    color: '#9ca3af',
    label: 'Grey',
    tier: 'Beginner',
    description: "Build your fitness foundation. Perfect if you're new, returning after a break, or just getting started.",
  },
  {
    color: '#4982e8',
    label: 'Blue',
    tier: 'Intermediate',
    description: 'Push your strength and endurance. For those ready to step things up with faster-paced sessions.',
  },
  {
    color: '#000000',
    label: 'Black',
    tier: 'Advanced',
    description: 'Train at maximum intensity. For experienced members who want to push their limits.',
    ring: true,
  },
]

export function LandingLevels() {
  return (
    <section className="bg-black py-24 overflow-hidden relative">
      {/* Mobile header image */}
      <div className="lg:hidden relative w-full h-56 mb-10 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/photos/img_levels_logos_tweaked.webp" alt="Training levels" className="w-full h-full object-contain scale-[1.35]" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-20 items-center">

          {/* Left — text */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <p className="text-brand-blue text-sm font-semibold uppercase tracking-widest mb-3">Our Colour System</p>
            <h2 className="text-4xl sm:text-5xl font-bold uppercase text-white tracking-tight mb-6">
              Train at<br />Your Level
            </h2>
            <p className="text-white/50 text-base leading-relaxed mb-10">
              Everyone trains together — just at the right intensity. Start where you&apos;re comfortable, and progress as your fitness improves.
            </p>

            <div className="flex flex-col gap-4">
              {levels.map((level, i) => (
                <motion.div
                  key={level.label}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.1 }}
                  className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4"
                >
                  <div
                    className="mt-0.5 h-5 w-5 rounded-full shrink-0 ring-1 ring-white/20"
                    style={{ background: level.color }}
                  />
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {level.label} <span className="text-white/40 font-normal">— {level.tier}</span>
                    </p>
                    <p className="text-white/50 text-sm mt-1 leading-relaxed">{level.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <p className="text-white/30 text-sm mt-6">
              Not sure which level you are?{' '}
              <a
                href="#booking"
                onClick={e => { e.preventDefault(); document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' }) }}
                className="text-white/60 hover:text-white transition-colors inline-flex items-center gap-1"
              >
                Our coaches will guide you <ChevronRight size={13} />
              </a>
            </p>
          </motion.div>

          {/* Right — full bleed image, breaks out of container on the right */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
            className="hidden lg:block relative -ml-8"
          >
            <div className="relative aspect-[4/5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/photos/img_levels_logos_tweaked.webp"
                alt="Training levels"
                className="w-full h-full object-contain scale-[1.35]"
              />

              {/* Bottom vignette */}
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
            </div>
          </motion.div>



        </div>
      </div>
    </section>
  )
}
