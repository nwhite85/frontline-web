import type { Metadata } from 'next'
import { ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'FAQ | Frontline Fitness Swindon',
  description: 'Answers to the most common questions about Frontline Fitness bootcamp in Swindon — sessions, membership, pricing, what to bring, and more.',
  openGraph: {
    title: 'FAQ | Frontline Fitness Swindon',
    description: 'Common questions about Frontline Fitness bootcamp in Swindon answered.',
    url: 'https://frontlinefitness.co.uk/faq',
  },
}

const faqs = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'Do I need to be fit to join?',
        a: 'No. Sessions are designed for all fitness levels, from complete beginners to experienced athletes. Every exercise is coached and can be modified to suit your current ability. The goal is progression — not perfection from day one.',
      },
      {
        q: 'What happens at my first session?',
        a: 'Arrive a couple of minutes early so the coach can introduce themselves, run through any relevant info, and answer any questions. Sessions begin with a warm-up, followed by the main workout, and finish with a cool-down. You will be guided through everything.',
      },
      {
        q: 'What should I bring?',
        a: 'Comfortable workout clothes you can move freely in, a water bottle, and trainers. We provide all equipment. Dress for the weather — sessions run outdoors in all conditions.',
      },
      {
        q: 'Is the first session really free?',
        a: 'Yes. Your first session is completely free with no card required and no commitment. Come and try it — if you love it, you can join. If it is not for you, no problem.',
      },
    ],
  },
  {
    category: 'Sessions & Training',
    items: [
      {
        q: 'How long are the sessions?',
        a: 'Sessions typically run for 45–60 minutes including warm-up and cool-down. This is enough time for a full, effective workout without needing to block out half your day.',
      },
      {
        q: 'Where do sessions take place?',
        a: 'Sessions are held at Lydiard Park (SN5 3PA) and Lydiard Academy in west Swindon. Exact location and meeting point details are shared when you book.',
      },
      {
        q: 'Do sessions run in bad weather?',
        a: 'Yes. Sessions run year-round in rain, cold, and wind. Only extreme weather conditions (lightning, severe storms) result in cancellations — and you will always be notified in advance. Dress appropriately and bring a layer.',
      },
      {
        q: 'How many sessions per week?',
        a: 'There are 6+ sessions available per week across different times and locations. Check the schedule on the booking page for current session times.',
      },
      {
        q: 'What kind of training do you do?',
        a: 'Sessions combine functional strength movements, cardiovascular conditioning, and bodyweight exercises. Think circuits, interval training, carries, and drills — all coached, varied, and progressive. No two sessions are the same.',
      },
    ],
  },
  {
    category: 'Membership & Pricing',
    items: [
      {
        q: 'How much does membership cost?',
        a: 'Membership starts from £38/month for unlimited sessions. We also offer pay-as-you-go and personal training options. Check the pricing page for current plans.',
      },
      {
        q: 'Can I cancel my membership?',
        a: 'Yes. Memberships are monthly and can be cancelled at any time. There are no long-term contracts or cancellation fees.',
      },
      {
        q: 'Do you offer personal training?',
        a: 'Yes. One-to-one and small group personal training sessions are available alongside bootcamp membership. Get in touch to discuss what works for your goals and schedule.',
      },
      {
        q: 'Is there a joining fee?',
        a: 'No joining fee. Just choose your membership, sign up, and show up.',
      },
    ],
  },
  {
    category: 'About Frontline Fitness',
    items: [
      {
        q: 'Who runs Frontline Fitness?',
        a: 'Frontline Fitness is run by Nick White, a qualified fitness instructor with 12 years of experience and a background in the Royal Marines. All coaches are qualified and experienced in group fitness instruction.',
      },
      {
        q: 'How is Frontline different from other gyms or bootcamps in Swindon?',
        a: 'Every session is fully coached — not just supervised. Instructors know members by name, track progress, and adapt sessions to the group. The outdoor environment and military-influenced training ethos sets the standard higher than most group fitness offerings in the area.',
      },
      {
        q: 'Do you have an app?',
        a: 'Yes. Frontline Fitness has a dedicated mobile app for members — available on iOS and Android. Book sessions, track your progress, view your membership, and stay connected with the community.',
      },
    ],
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.flatMap(section =>
    section.items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    }))
  ),
}

export default function FAQPage() {
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
        <p className="text-brand-blue text-xs font-semibold uppercase tracking-widest mb-3">Frontline Fitness</p>
        <h1 className="text-4xl sm:text-5xl font-bold uppercase tracking-tight text-white mb-4">
          Frequently Asked<br />Questions
        </h1>
        <p className="text-white/50 text-lg max-w-xl">
          Everything you need to know before your first session and beyond.
        </p>
      </div>

      {/* FAQ sections */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 sm:px-8 lg:px-12 pb-16">
        <div className="max-w-2xl space-y-14">
          {faqs.map(section => (
            <div key={section.category}>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-blue mb-6">{section.category}</p>
              <div className="space-y-6">
                {section.items.map(({ q, a }) => (
                  <div key={q} className="border-b border-white/[0.06] pb-6 last:border-0">
                    <h2 className="text-white font-semibold mb-2 leading-snug">{q}</h2>
                    <p className="text-white/50 text-sm leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold">Still got questions?</p>
            <p className="text-white/40 text-sm">Get in touch — we're happy to help.</p>
          </div>
          <div className="flex gap-3">
            <a href="/#booking" className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/85 text-white rounded-full px-5 py-2.5 text-sm font-semibold transition-colors">
              Book free trial <ChevronRight size={13} />
            </a>
            <a href="/support" className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white/70 hover:text-white rounded-full px-5 py-2.5 text-sm font-semibold transition-colors">
              Contact us
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="h-14 border-t border-white/10">
        <div className="max-w-6xl mx-auto pl-[13px] sm:pl-[21px] lg:pl-[29px] pr-4 sm:pr-6 lg:pr-8 h-full flex items-center gap-6">
          <span className="text-xs text-white/30">© Frontline Fitness</span>
          <a href="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">Privacy &amp; Terms</a>
        </div>
      </div>
    </div>
  )
}
