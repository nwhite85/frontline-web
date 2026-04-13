'use client'

import { useState } from 'react'
import { Container } from '@/components/ui/container'
import { Navigation, MapPin, ChevronDown } from 'lucide-react'

export function LandingLocation() {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-[#090909] border-t border-white/10">
      <Container>
        {/* Collapsed bar */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between py-5 text-left group"
        >
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-brand-blue shrink-0" />
            <span className="text-white/70 text-sm font-medium group-hover:text-white transition-colors">
              Where to find us
            </span>
            <span className="hidden sm:inline text-white/30 text-sm">—</span>
            <span className="hidden sm:inline text-white/40 text-sm">Lydiard Park, SN5 3PA</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-white/30 group-hover:text-white/60 transition-all ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Expanded content */}
        {open && (
          <div className="pb-16 flex flex-col lg:flex-row gap-12 lg:gap-16 items-start border-t border-white/[0.06] pt-10">

            {/* Text side */}
            <div className="flex-shrink-0 lg:w-72">
              <p className="text-brand-blue text-sm font-semibold uppercase tracking-widest mb-3">Location</p>
              <h2 className="text-4xl sm:text-5xl font-bold uppercase text-white tracking-tight mb-6 leading-tight">
                Where to<br />find us.
              </h2>
              <p className="text-white/50 text-base leading-relaxed mb-6">
                We train outdoors at Lydiard Park — one of Swindon&apos;s best open spaces. Parking available on site.
              </p>

              <div className="flex flex-col gap-3 mb-8">
                <div>
                  <p className="text-white font-semibold text-base">Lydiard Park</p>
                  <p className="text-white/50 text-base">Swindon, SN5 3PA</p>
                </div>
              </div>

              <a
                href="https://maps.app.goo.gl/NGKG5PJqeb2HNFFR9"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 py-3 px-6 rounded-full bg-brand-blue hover:bg-brand-blue/85 text-white text-sm font-medium transition-colors"
              >
                <Navigation className="h-3.5 w-3.5" />
                Get directions
              </a>
            </div>

            {/* Map side */}
            <div className="flex-1 w-full">
              <div className="relative w-full rounded-xl overflow-hidden border border-white/10" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  title="Frontline Fitness location"
                  src="https://maps.google.com/maps?q=51.5620461,-1.8499188&t=&z=17&ie=UTF8&iwloc=&output=embed"
                  className="absolute inset-0 w-full h-full"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

          </div>
        )}
      </Container>
    </div>
  )
}
