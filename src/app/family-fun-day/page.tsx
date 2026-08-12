import type { Metadata } from 'next'
import { CalendarDays, Clock, MapPin, Users, Flag, Droplets, Sandwich, Ticket } from 'lucide-react'
import { EVENT } from './event'
import { RegistrationForm } from './RegistrationForm'

export const metadata: Metadata = {
  title: `${EVENT.name} | Frontline Fitness`,
  description: `Register for the Frontline Fitness ${EVENT.name} — ${EVENT.date}. Mini assault course, team games, water fight and a picnic to finish. Free for members and their families.`,
  // Shared by link rather than found on Google — keep it out of search results.
  robots: { index: false, follow: false },
}

// Feathers every edge of the hero photo out into the page background so it
// sits on the black rather than being a rectangle stuck on top of it.
const HERO_FADE = [
  'linear-gradient(to right, transparent 0%, #000 32%, #000 88%, transparent 100%)',
  'linear-gradient(to bottom, transparent 0%, #000 24%, #000 76%, transparent 100%)',
].join(', ')

const whatsOn = [
  { icon: Flag, title: 'Mini Assault Course', desc: 'A scaled-down version of the real thing. Crawl, climb, carry — kids love it, adults are welcome to embarrass themselves too.' },
  { icon: Users, title: 'Team Games', desc: 'Mixed teams, all ages, nothing too serious. Relays, tug of war, and a few where the kids have the clear advantage.' },
  { icon: Droplets, title: 'Water Fight', desc: 'It finishes how you would expect. No one stays dry, so plan your outfit accordingly.' },
  { icon: Sandwich, title: 'Picnic to Finish', desc: 'Bring a blanket and whatever you fancy eating and drinking — or something to share. We all sit down together once the chaos dies down.' },
]

export default function FamilyFunDayPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
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
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 pt-16 pb-12 w-full">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-10 items-center">
          <div>
            <div className="flex items-center gap-2 text-brand-blue text-xs font-semibold uppercase tracking-widest mb-3">
              <CalendarDays size={12} />
              {EVENT.date}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold uppercase tracking-tight text-white mb-4">
              Family Fun Day<br />&amp; Picnic
            </h1>
            <p className="text-white/50 text-lg max-w-xl mb-8">
              Morning and afternoon, the whole family. Mini assault course, team games, a
              water fight nobody wins, and a picnic to finish. Free to come along — we just
              need to know how many of you are coming.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
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

          {/* Feathered into the black rather than sat in a box */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/family-fun-day.webp"
            alt="A young girl soaking everyone in range with a water pistol"
            width={1100}
            height={619}
            className="w-full h-auto"
            style={{
              maskImage: HERO_FADE,
              WebkitMaskImage: HERO_FADE,
              // Both gradients have to agree for a pixel to show, which feathers
              // all four edges instead of just the two the last gradient covers.
              maskComposite: 'intersect',
              WebkitMaskComposite: 'source-in',
            }}
          />
        </div>
      </div>

      {/* What's on */}
      <div className="border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-blue mb-4">The day</p>
          <h2 className="text-3xl font-bold uppercase tracking-tight text-white mb-8">What&apos;s On</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whatsOn.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6">
                <Icon size={20} className="text-brand-blue opacity-70 mb-3" />
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
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
