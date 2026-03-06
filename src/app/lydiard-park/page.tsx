import type { Metadata } from 'next'
import { MapPin, ChevronRight, Trees, Wind, Sun } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Fitness Classes at Lydiard Park, Swindon | Frontline Fitness',
  description: 'Outdoor fitness bootcamp sessions at Lydiard Park, Swindon. Coach-led group training in one of Wiltshire\'s best parks. All levels welcome — first session free.',
  openGraph: {
    title: 'Fitness Classes at Lydiard Park, Swindon | Frontline Fitness',
    description: 'Outdoor bootcamp at Lydiard Park, Swindon. Coach-led sessions, all fitness levels, first session free.',
    url: 'https://frontlinefitness.co.uk/lydiard-park',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SportsActivityLocation',
  name: 'Frontline Fitness — Lydiard Park',
  description: 'Outdoor bootcamp and fitness training sessions at Lydiard Park, Swindon, Wiltshire.',
  url: 'https://frontlinefitness.co.uk/lydiard-park',
  hasMap: 'https://maps.google.com/?q=Lydiard+Park+Swindon',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Lydiard Park',
    addressLocality: 'Swindon',
    postalCode: 'SN5 3PA',
    addressRegion: 'Wiltshire',
    addressCountry: 'GB',
  },
}

const faqs = [
  { q: 'Where exactly in Lydiard Park are sessions held?', a: 'Sessions meet at the main car park entrance on Lydiard Park (SN5 3PA). The coach will be visible — look for the group gathering near the open grass area. Exact details are confirmed when you book.' },
  { q: 'Is parking available at Lydiard Park?', a: 'Yes, there is a free car park at Lydiard Park with ample space. It is well signposted from the main road.' },
  { q: 'What happens if it rains?', a: 'Sessions run in all weathers — rain, cold, and wind included. This is outdoor training, not a gym class. Dress appropriately for conditions and sessions will go ahead. Only extreme weather (lightning etc) results in cancellation, and you will always be notified in advance.' },
  { q: 'Is Lydiard Park suitable for beginners?', a: 'Yes. The flat, open terrain at Lydiard Park makes it ideal for all fitness levels. Sessions are fully coached and all exercises can be modified to suit beginners. Many of our most committed members started with no fitness background at all.' },
]

export default function LydiardParkPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

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
          Lydiard Park, SN5 3PA
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold uppercase tracking-tight text-white mb-4 max-w-2xl">
          Fitness Classes at<br />Lydiard Park
        </h1>
        <p className="text-white/50 text-lg max-w-xl mb-8">
          Train outdoors in one of Swindon's best parks. Coach-led bootcamp sessions on the open grass of Lydiard Park — year-round, all weathers, all levels.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="/#booking" className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/85 text-white rounded-full px-6 py-3 text-sm font-semibold transition-colors">
            Book a free trial <ChevronRight size={14} />
          </a>
          <a href="/swindon-bootcamp" className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white/70 hover:text-white rounded-full px-6 py-3 text-sm font-semibold transition-colors">
            About our sessions
          </a>
        </div>
      </div>

      {/* Why Lydiard Park */}
      <div className="border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-blue mb-4">The location</p>
          <h2 className="text-3xl font-bold uppercase tracking-tight text-white mb-8">Why Lydiard Park?</h2>
          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Trees, title: '260 Acres of Parkland', desc: 'Open space to spread out, sprint, and move freely without the constraints of a gym floor.' },
              { icon: Wind, title: 'Year-Round Training', desc: 'Sessions run in all conditions. The open park environment and natural terrain is what makes the training effective.' },
              { icon: Sun, title: 'Free to Access', desc: 'Lydiard Park is publicly accessible with free parking — no gym door to walk through, no overpriced smoothie bar.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6">
                <Icon size={20} className="text-brand-blue opacity-70 mb-3" />
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="max-w-2xl space-y-4 text-white/60 leading-relaxed">
            <p>Lydiard Park sits on the western edge of Swindon and offers over 260 acres of managed parkland, open grass, and natural terrain. For fitness training, it provides everything a gym can't: real ground, real weather, and real space.</p>
            <p>Frontline Fitness has run sessions at Lydiard Park since launch. The combination of flat open areas for circuits, natural inclines for conditioning work, and firm grass surfaces makes it one of the best outdoor training venues in Wiltshire.</p>
          </div>
        </div>
      </div>

      {/* Getting there */}
      <div className="border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-blue mb-4">Getting there</p>
          <h2 className="text-3xl font-bold uppercase tracking-tight text-white mb-6">Location &amp; Parking</h2>
          <div className="max-w-xl space-y-3 text-white/60 text-sm leading-relaxed mb-6">
            <p><span className="text-white font-medium">Address:</span> Lydiard Park, Swindon, SN5 3PA</p>
            <p><span className="text-white font-medium">Parking:</span> Free car park on site, well signposted from the A3102 and M4 junction 16.</p>
            <p><span className="text-white font-medium">Meeting point:</span> Confirmed with your booking — typically near the main car park on the open grass.</p>
          </div>
          <a
            href="https://maps.google.com/?q=Lydiard+Park+Swindon+SN5+3PA"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white/70 hover:text-white rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
          >
            <MapPin size={13} />
            Open in Google Maps
          </a>
        </div>
      </div>

      {/* FAQs */}
      <div className="border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-blue mb-4">FAQ</p>
          <h2 className="text-3xl font-bold uppercase tracking-tight text-white mb-8">Questions About Lydiard Park Sessions</h2>
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
          <h2 className="text-3xl font-bold uppercase tracking-tight text-white mb-3">Come and Train at Lydiard Park</h2>
          <p className="text-white/50 mb-8">First session is free. Join us at Swindon's best outdoor fitness venue.</p>
          <a href="/#booking" className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/85 text-white rounded-full px-8 py-3 text-sm font-semibold transition-colors">
            Book your free session <ChevronRight size={14} />
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
