import type { Metadata } from 'next'
import { CalendarDays, Clock, MapPin, Ticket } from 'lucide-react'
import { EVENT } from './event'
import { BookingForm } from './BookingForm'

export const metadata: Metadata = {
  title: `${EVENT.name} | Frontline Fitness`,
  description: `Secure your place at the Frontline Fitness ${EVENT.name} — ${EVENT.date} at ${EVENT.location}. £${EVENT.total.toFixed(2)} a head, £${EVENT.deposit} deposit to book.`,
  // Shared by link rather than found on Google — keep it out of search results.
  robots: { index: false, follow: false },
}

export default function ChristmasDoPage() {
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

      {/* Hero — photo runs to the rails behind the title on desktop, and stacks
          above it on narrow screens where there isn't the width for both. */}
      <div className="max-w-6xl mx-auto w-full relative isolate overflow-hidden lg:min-h-[660px] lg:flex lg:items-end">
        <div className="relative lg:absolute lg:inset-0 lg:-z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/christmas-do.webp"
            alt="Tables laid for Christmas dinner at Bassett Down, candles lit and the tree up"
            className="w-full h-64 sm:h-80 lg:h-full object-cover object-[60%_center]"
          />
          <div className="lg:hidden absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
        </div>
        {/* Darkened from the left and the bottom so the type stays readable and
            the photo runs out into the black of the section below it. */}
        <div className="hidden lg:block absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/50 to-transparent" />
        <div className="hidden lg:block absolute inset-0 -z-10 bg-gradient-to-t from-black via-transparent to-black/40" />

        <div className="relative px-6 sm:px-8 lg:px-12 w-full pt-8 pb-12 lg:pb-14 lg:pt-28">
          <div className="flex items-center gap-2 text-brand-blue text-xs font-semibold uppercase tracking-widest mb-3">
            <CalendarDays size={12} />
            {EVENT.date}
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold uppercase tracking-tight text-white mb-5 drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]">
            Christmas<br />Do
          </h1>
          <p className="text-white/70 text-lg max-w-xl mb-8">
            The whole Frontline crew, out of kit and in one room. A proper night at
            Bassett Down to finish the year off — put your deposit down and we&apos;ll
            hold your place.
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
            <span className="inline-flex items-center gap-2"><Ticket size={13} className="text-brand-blue" /> £{EVENT.total.toFixed(2)} a head — £{EVENT.deposit} deposit to book</span>
          </div>
        </div>
      </div>

      {/* Book — set on a blue band so it reads as its own thing */}
      <div className="border-y border-brand-blue/20 bg-blue-950/40" id="book">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-blue mb-4">Secure your place</p>
              <h2 className="text-3xl font-bold uppercase tracking-tight text-white mb-4">Get Your Name Down</h2>
              <div className="space-y-4 text-white/60 text-sm leading-relaxed max-w-md">
                <p>
                  The night is £{EVENT.total.toFixed(2)} a head. £{EVENT.deposit} now holds
                  your place, and the remaining £{(EVENT.total - EVENT.deposit).toFixed(2)} is
                  settled nearer the time, once numbers are in and the venue has confirmed
                  the final details.
                </p>
                <p>
                  Everyone books and pays for themselves, so if you&apos;re bringing a
                  partner, just run through it again for them.
                </p>
                <p className="text-white/40 text-xs">
                  Deposits are what let us hold the room, so they aren&apos;t refundable
                  once numbers go to the venue — we&apos;ll always give you plenty of
                  warning before that happens.
                </p>
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
