import type { Metadata } from 'next'
import { MapPin, Users, Clock, Star, ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Outdoor Bootcamp in Swindon | Frontline Fitness',
  description: 'Join Swindon\'s leading outdoor bootcamp. Coach-led group fitness sessions at Lydiard Park and Lydiard Academy. All fitness levels welcome. First session free.',
  openGraph: {
    title: 'Outdoor Bootcamp in Swindon | Frontline Fitness',
    description: 'Coach-led outdoor bootcamp sessions across Swindon. All fitness levels welcome — first session free.',
    url: 'https://frontlinefitness.co.uk/swindon-bootcamp',
  },
  alternates: {
    canonical: 'https://frontlinefitness.co.uk/swindon-bootcamp',
  },
}

const breadcrumb = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://frontlinefitness.co.uk' },
    { '@type': 'ListItem', position: 2, name: 'Swindon Bootcamp', item: 'https://frontlinefitness.co.uk/swindon-bootcamp' },
  ],
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SportsActivityLocation',
  name: 'Frontline Fitness — Swindon Bootcamp',
  description: 'Outdoor bootcamp sessions in Swindon at Lydiard Park and Lydiard Academy. All fitness levels welcome.',
  url: 'https://frontlinefitness.co.uk/swindon-bootcamp',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Swindon',
    addressRegion: 'Wiltshire',
    addressCountry: 'GB',
  },
  telephone: '07361579678',
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Wednesday', 'Friday'], opens: '06:00', closes: '08:00' },
  ],
}

const faqs = [
  { q: 'Do I need to be fit to join a bootcamp in Swindon?', a: 'Not at all. Frontline Fitness sessions are designed for all fitness levels, from complete beginners to experienced athletes. Every exercise can be modified to suit your current ability.' },
  { q: 'Where do the Swindon bootcamp sessions take place?', a: 'Sessions are held at Lydiard Park (SN5 3PA) and Lydiard Academy, both in west Swindon. Exact location details are shared when you book.' },
  { q: 'How much does bootcamp in Swindon cost?', a: 'Membership starts from £38/month for unlimited sessions. Your first session is completely free — no card required.' },
  { q: 'What should I bring to my first session?', a: 'Comfortable workout clothes, a water bottle, and trainers. We provide all equipment. Arrive a couple of minutes early so the coach can introduce themselves.' },
]

export default function SwindonBootcampPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

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
        <div className="flex items-center gap-2 text-brand-blue text-xs font-semibold uppercase tracking-widest mb-3">
          <MapPin size={12} />
          Swindon, Wiltshire
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold uppercase tracking-tight text-white mb-4 max-w-2xl">
          Outdoor Bootcamp<br />in Swindon
        </h1>
        <p className="text-white/50 text-lg max-w-xl mb-8">
          Coach-led group fitness sessions at Lydiard Park and Lydiard Academy. All levels welcome — from first-timers to seasoned athletes.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="/#booking" className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/85 text-white rounded-full px-6 py-3 text-sm font-semibold transition-colors">
            Book a free trial <ChevronRight size={14} />
          </a>
          <a href="/#pricing" className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white/70 hover:text-white rounded-full px-6 py-3 text-sm font-semibold transition-colors">
            View pricing
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="border-y border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { icon: Users, label: 'Active members', value: '50+' },
            { icon: Clock, label: 'Sessions per week', value: '6+' },
            { icon: MapPin, label: 'Locations', value: '2' },
            { icon: Star, label: 'First session', value: 'Free' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col gap-1">
              <Icon size={16} className="text-brand-blue opacity-70" />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-white/40 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-blue mb-4">What to expect</p>
          <h2 className="text-3xl font-bold uppercase tracking-tight text-white mb-6">Swindon's Outdoor Fitness Community</h2>
          <div className="space-y-4 text-white/60 leading-relaxed">
            <p>Frontline Fitness runs multiple weekly bootcamp sessions across Swindon, led by instructors with military and professional fitness backgrounds. Sessions combine strength work, cardio, and functional movement — all coached, all outdoors.</p>
            <p>Whether you're looking to lose weight, build fitness, or simply get out of the gym and train with a motivating group, Frontline Fitness delivers results in a format that people actually stick to.</p>
            <p>Sessions take place year-round at Lydiard Park and Lydiard Academy — two of Swindon's best outdoor spaces for fitness training. All equipment is provided. All you need to bring is yourself.</p>
          </div>
        </div>
      </div>

      {/* Locations */}
      <div className="border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-blue mb-4">Where we train</p>
          <h2 className="text-3xl font-bold uppercase tracking-tight text-white mb-8">Swindon Training Locations</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <a href="/lydiard-park" className="group rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05] transition-all p-6">
              <div className="flex items-center gap-2 text-brand-blue mb-3">
                <MapPin size={14} />
                <span className="text-xs font-semibold uppercase tracking-widest">Lydiard Park</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Lydiard Park, SN5 3PA</h3>
              <p className="text-white/50 text-sm leading-relaxed">260 acres of open parkland in west Swindon. Flat areas, natural terrain, and space to train properly — whatever the weather.</p>
              <span className="inline-flex items-center gap-1 text-brand-blue text-sm mt-4 group-hover:gap-2 transition-all">
                Learn more <ChevronRight size={12} />
              </span>
            </a>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6">
              <div className="flex items-center gap-2 text-brand-blue mb-3">
                <MapPin size={14} />
                <span className="text-xs font-semibold uppercase tracking-widest">Lydiard Academy</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Lydiard Academy, SN5</h3>
              <p className="text-white/50 text-sm leading-relaxed">Hard-standing surface ideal for circuits and strength-based sessions. Used for select weekly sessions alongside Lydiard Park.</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-blue mb-4">FAQ</p>
          <h2 className="text-3xl font-bold uppercase tracking-tight text-white mb-8">Common Questions</h2>
          <div className="max-w-2xl space-y-6">
            {faqs.map(({ q, a }) => (
              <div key={q} className="border-b border-white/[0.06] pb-6 last:border-0">
                <h3 className="text-white font-semibold mb-2">{q}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-16 text-center">
          <h2 className="text-3xl font-bold uppercase tracking-tight text-white mb-3">Ready to Get Started?</h2>
          <p className="text-white/50 mb-8">Your first bootcamp session in Swindon is free. No commitment, no pressure.</p>
          <a href="/#booking" className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/85 text-white rounded-full px-8 py-3 text-sm font-semibold transition-colors">
            Book your free trial <ChevronRight size={14} />
          </a>
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
