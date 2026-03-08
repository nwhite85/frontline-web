import { Container } from '@/components/ui/container'
import { ChevronRight } from 'lucide-react'
import { ScrollButton } from './ScrollButton'

export function LandingHero() {
  return (
    <section
      className="relative overflow-hidden bg-black"
      style={{ height: "calc(100svh - 4rem)", marginTop: "4rem", maxWidth: "85rem", marginLeft: "auto", marginRight: "auto" }}
    >
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/photos/img_tug10.webp"
        alt="Frontline Fitness outdoor bootcamp training"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 w-full h-full object-contain hero-img"
        style={{
          filter: 'brightness(0.90) contrast(1.05)',
        }}
      />

      {/* Edge fades */}
      <div className="absolute inset-y-0 right-0 w-16 sm:w-56 xl:w-80 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 left-0 w-16 sm:w-56 xl:w-80 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />

      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none z-10" />

      {/* Text card — pinned to bottom */}
      <div className="absolute inset-x-0 bottom-4 z-10">
        <Container className="px-6 sm:px-8">
          <div className="text-right">
            <div className="flex flex-wrap items-baseline gap-x-3 mb-2 justify-end animate-fade-up">
              <h1 className="contents">
                <span className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-none drop-shadow-lg">
                  FRONTLINE
                </span>
                <span className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-none drop-shadow-lg">
                  FITNESS
                </span>
              </h1>
            </div>
            <p className="text-sm sm:text-base text-white/80 max-w-md leading-relaxed mb-5 drop-shadow ml-auto animate-fade-up animation-delay-150">
              Forces-led outdoor fitness for everyone. Train in the fresh air with expert guidance that gets results.
            </p>
            <div className="animate-fade-up animation-delay-300">
              <ScrollButton
                target="booking"
                className="inline-flex items-center bg-brand-blue hover:bg-brand-blue/85 text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
              >
                Try a Class <ChevronRight size={14} className="ml-1" />
              </ScrollButton>
            </div>
          </div>
        </Container>
      </div>
    </section>
  )
}
