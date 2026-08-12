import type { Metadata } from 'next'
import { CalendarDays, Clock, MapPin, Ticket } from 'lucide-react'
import { EVENT } from './event'
import { RegistrationForm } from './RegistrationForm'

export const metadata: Metadata = {
  title: `${EVENT.name} | Frontline Fitness`,
  description: `Register for the Frontline Fitness ${EVENT.name} — ${EVENT.date}. Mini assault course, team games, water fight and a picnic to finish. Free for members and their families.`,
  // Shared by link rather than found on Google — keep it out of search results.
  robots: { index: false, follow: false },
}

export default function FamilyFunDayPage() {
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

      {/* Hero — photo runs to the rails rather than the full viewport. It sits
          behind the title on desktop, and stacks above it on narrow screens
          where there isn't the width to keep both readable. */}
      <div className="max-w-6xl mx-auto w-full relative isolate overflow-hidden lg:min-h-[660px] lg:flex lg:items-end">
        <div className="relative lg:absolute lg:inset-0 lg:-z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/family-fun-day.webp"
            alt="A young girl soaking everyone in range with a water pistol"
            className="w-full h-64 sm:h-80 lg:h-full object-cover object-[72%_center]"
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
            Family Fun Day<br />&amp; Picnic
          </h1>
          <p className="text-white/70 text-lg max-w-xl mb-8">
            Morning and afternoon, the whole family. Mini assault course, team games, a
            water fight nobody wins, and a picnic to finish. Free to come along — we just
            need to know how many of you are coming.
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
            <span className="inline-flex items-center gap-2"><Ticket size={13} className="text-brand-blue" /> {EVENT.cost}</span>
          </div>
        </div>
      </div>

      {/* Register — set on a blue band so it reads as its own thing */}
      <div className="border-y border-brand-blue/20 bg-blue-950/40" id="register">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-blue mb-4">Register</p>
              <h2 className="text-3xl font-bold uppercase tracking-tight text-white mb-4">Let Us Know You&apos;re Coming</h2>
              <div className="space-y-4 text-white/60 text-sm leading-relaxed max-w-md">
                <p>
                  Registering takes a minute and helps us plan properly — how many kids
                  are coming decides how we set up the assault course and how much
                  water we need on standby.
                </p>
                <p>
                  It&apos;s free, and everyone&apos;s welcome: partners, kids, grandparents,
                  friends who&apos;ve been meaning to come along.
                </p>
                <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4 space-y-2">
                  <p className="text-white font-medium text-sm">Bring with you</p>
                  <ul className="text-white/50 text-sm space-y-1 list-disc list-inside">
                    <li>A towel and a change of clothes for the kids</li>
                    <li>Sun cream, and a picnic blanket if you have one</li>
                    <li>Whatever you want to eat and drink — or something to share</li>
                  </ul>
                </div>
                <p className="text-white/40 text-xs">
                  For the form, a child means anyone {EVENT.childAgeCutoff} or under.
                </p>
              </div>
            </div>
            <RegistrationForm />
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
