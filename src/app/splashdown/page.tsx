import type { Metadata } from 'next'
import { CalendarDays, Clock, MapPin, Ticket } from 'lucide-react'
import { EVENT } from './event'
import { BookingForm } from './BookingForm'

export const metadata: Metadata = {
  title: `${EVENT.name} | Frontline Fitness`,
  description: `Book your place on the Frontline Fitness ${EVENT.name} — ${EVENT.date}. A day at the lake: BBQ, games on the grass, swimming and good company. £${EVENT.price} per person.`,
  // Shared by link rather than found on Google — keep it out of search results.
  robots: { index: false, follow: false },
}

export default function SplashdownPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Container rails, same as the main site — they give the page its vertical edges */}
      <div className="fixed inset-0 sm:top-16 pointer-events-none z-[60]">
        <div className="max-w-6xl mx-auto h-full sm:border-x border-[rgba(255,255,255,0.10)]" />
      </div>

      {/* Nav */}
      <div className="sticky top-0 z-30 h-16 border-b border-white/10 bg-black">
        <div className="max-w-6xl mx-auto pl-[13px] sm:pl-[21px] lg:pl-[29px] pr-4 sm:pr-6 lg:pr-8 h-full flex items-center">
          <a href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/frontline-logo-blue.png" alt="Frontline Fitness" width="80" height="20" style={{ height: '20px', width: 'auto' }} />
          </a>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto w-full px-6 sm:px-8 lg:px-12 pt-20 pb-14">
        <div className="flex items-center gap-2 text-brand-blue text-xs font-semibold uppercase tracking-widest mb-3">
          <CalendarDays size={12} />
          {EVENT.date}
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold uppercase tracking-tight text-white mb-5">
          Summer<br />Splashdown
        </h1>
        <p className="text-white/60 text-lg max-w-xl mb-8">
          A day at the lake. Swimming, games on the grass, food on the BBQ and good
          company — the sociable end of what we do, with none of the burpees. Food&apos;s
          included, just bring what you want to drink.
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
          <span className="inline-flex items-center gap-2"><Clock size={13} className="text-brand-blue" /> {EVENT.time}</span>
          <a
            href={`https://maps.google.com/?q=${EVENT.mapsQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:text-white transition-colors"
          >
            <MapPin size={13} className="text-brand-blue" /> {EVENT.location}
          </a>
          <span className="inline-flex items-center gap-2"><Ticket size={13} className="text-brand-blue" /> £{EVENT.price} per person</span>
        </div>
      </div>

      {/* Book — set on a blue band so it reads as its own thing */}
      <div className="border-y border-brand-blue/20 bg-blue-950/40" id="book">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-blue mb-4">Book</p>
              <h2 className="text-3xl font-bold uppercase tracking-tight text-white mb-4">Grab Your Place</h2>
              <div className="space-y-4 text-white/60 text-sm leading-relaxed max-w-md">
                <p>
                  £{EVENT.price} covers your place for the day and your food. Everyone
                  books and pays for themselves, so if you&apos;re bringing someone, just
                  run through it again for them.
                </p>
                <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4 space-y-2">
                  <p className="text-white font-medium text-sm">Bring with you</p>
                  <ul className="text-white/50 text-sm space-y-1 list-disc list-inside">
                    <li>Whatever you want to drink — food is provided</li>
                    <li>Swim kit, a towel and a change of clothes</li>
                    <li>Sun cream and something to sit on</li>
                    <li>A chair if you like your comfort</li>
                  </ul>
                </div>
              </div>
            </div>
            <BookingForm />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="h-14 border-t border-white/10 mt-auto">
        <div className="max-w-6xl mx-auto pl-[13px] sm:pl-[21px] lg:pl-[29px] pr-4 sm:pr-6 lg:pr-8 h-full flex items-center gap-6">
          <span className="text-xs text-white/30">© Frontline Fitness</span>
          <a href="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">Privacy &amp; Terms</a>
        </div>
      </div>
    </div>
  )
}
