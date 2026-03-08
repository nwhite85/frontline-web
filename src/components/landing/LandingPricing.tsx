'use client'

import { useState } from 'react'
import { Container } from '@/components/ui/container'
import { Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Plan {
  id: string
  name: string
  price: number
  plan_type: 'recurring' | 'credit_package' | 'drop_in'
  description?: string
  class_credits?: number
  is_highlighted?: boolean
  is_active: boolean
  display_order?: number
  slug?: string
}

interface DisplayPlan {
  name: string
  price: string
  period: string
  features: string[]
  highlighted: boolean
  buttonText: string
  slug: string
}

function transformPlan(plan: Plan): DisplayPlan {
  const features = plan.description
    ? plan.description.split('\n').filter((l) => l.trim() !== '')
    : []

  const isRecurring = plan.plan_type === 'recurring'
  let period = '/month'
  let buttonText = 'Get Started'

  if (!isRecurring) {
    period = plan.class_credits === 1 ? '/class' : '/pack'
    buttonText = plan.class_credits === 1 ? 'Book Now' : 'Buy Pack'
  }

  const slug = plan.slug || plan.name.toLowerCase().replace(/\s+/g, '_')

  return {
    name: plan.name,
    price: `£${plan.price}`,
    period,
    features,
    highlighted: plan.is_highlighted ?? false,
    buttonText,
    slug,
  }
}

interface FounderDisplayPlan extends DisplayPlan {
  standardPrice?: string
}

const fallbackMemberships: FounderDisplayPlan[] = [
  {
    name: '1 Class',
    price: '£32',
    standardPrice: '£34',
    period: '/month',
    features: ['1 class per week', 'Circuits, Intervals, Strength, Endurance', 'Personal progress tracking', 'Community support'],
    highlighted: false,
    buttonText: 'Get Started',
    slug: '1_class',
  },
  {
    name: '2 Classes',
    price: '£39',
    standardPrice: '£41',
    period: '/month',
    features: ['2 classes per week', 'Circuits, Intervals, Strength, Endurance', 'Personal progress tracking', 'Community support'],
    highlighted: false,
    buttonText: 'Get Started',
    slug: '2_classes',
  },
  {
    name: 'Unlimited',
    price: '£42',
    standardPrice: '£44',
    period: '/month',
    features: ['Unlimited classes', 'Circuits, Intervals, Strength, Endurance', 'Personal progress tracking', 'Community support'],
    highlighted: true,
    buttonText: 'Most Popular',
    slug: 'unlimited',
  },
]

const fallbackPayGo: DisplayPlan[] = [
  {
    name: 'Drop-in Class',
    price: '£12',
    period: '/class',
    features: ['Single class access', 'No commitment', 'Circuits, Intervals, Strength, Endurance', 'Perfect for trying us out'],
    highlighted: true,
    buttonText: 'Book Now',
    slug: 'drop-in_class',
  },
  {
    name: '5 Credits',
    price: '£55',
    period: '/pack',
    features: ['5 classes to use anytime', '3 month expiry', 'Circuits, Intervals, Strength, Endurance', 'Save £5 vs drop-in'],
    highlighted: false,
    buttonText: 'Buy Pack',
    slug: '5_credits',
  },
  {
    name: '10 Credits',
    price: '£100',
    period: '/pack',
    features: ['10 classes to use anytime', '6 month expiry', 'Circuits, Intervals, Strength, Endurance', 'Save £20 vs drop-in'],
    highlighted: false,
    buttonText: 'Best Value',
    slug: '10_credits',
  },
]

function PricingCard({ plan, isFounder }: { plan: FounderDisplayPlan, isFounder?: boolean }) {

  return (
    <div className="relative pt-4">
      {plan.highlighted && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-brand-blue text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap z-10">
          Most Popular
        </div>
      )}
      <div
        className={`rounded-2xl p-6 flex flex-col gap-6 ${
          plan.highlighted
            ? 'bg-blue-950/30'
            : 'bg-white/[0.03]'
        }`}
        style={{
          boxShadow: plan.highlighted
            ?'0 8px 32px rgba(73,130,232,0.25), 0 0 0 1px rgba(73,130,232,0.6), inset 0 0 0 2px rgba(0,0,0,0.35)'
            :'0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.10), inset 0 0 0 2px rgba(0,0,0,0.35)'
        }}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
            {isFounder && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-brand-blue border border-brand-blue/30 bg-brand-blue/10 px-2 py-0.5 rounded-full hover:bg-brand-blue/20 transition-colors">
                    Founder
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-[#0d1420] border border-white/10 text-white p-4" side="top">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-blue mb-2">Founding Member Rate</p>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Sign up before <span className="text-white font-medium">1 June 2026</span> and you&apos;ll always pay less than our standard rate — even with annual price rises.
                  </p>
                  <p className="text-xs text-white/40 mt-2">
                    Standard rate from June: {plan.standardPrice}/month
                  </p>
                  <p className="text-xs text-white/50 mt-3 pt-3 border-t border-white/10">
                    All existing members will be on the Founder rate.
                  </p>
                </PopoverContent>
              </Popover>
            )}
          </div>
          <div className="flex items-end gap-1">
            <span className="text-4xl font-bold text-white">{plan.price}</span>
            <span className="text-sm mb-1 text-white/50">{plan.period}</span>
          </div>
          {isFounder && plan.standardPrice && (
            <p className="text-xs text-white/30 mt-1.5">
              Standard rate: <span className="line-through">{plan.standardPrice}</span>/month after launch
            </p>
          )}
        </div>

        {plan.features.length > 0 && (
          <ul className="space-y-2 flex-1">
            {plan.features.map((f, i) => (
              <li key={i} className={`flex items-start gap-2 text-sm text-white/70`}>
                <Check size={14} className="text-brand-blue mt-0.5 flex-shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => (window.location.href = `/signup?plan=${plan.slug}`)}
          className={`w-full py-2.5 rounded-full text-sm font-medium transition-colors ${
            plan.highlighted
              ? 'bg-brand-blue hover:bg-brand-blue/85 text-white'
              :'bg-white/10 hover:bg-white/20 text-white'
          }`}
        >
          {plan.buttonText}
        </button>
      </div>
    </div>
  )
}

export function LandingPricing({ initialPlans }: { initialPlans?: Plan[] }) {
  const [tab, setTab] = useState<'memberships' | 'paygo'>('memberships')

  const sortByPrice = (a: DisplayPlan, b: DisplayPlan) => {
    const aPrice = parseFloat(a.price.replace(/[^0-9.]/g, ''))
    const bPrice = parseFloat(b.price.replace(/[^0-9.]/g, ''))
    return aPrice - bPrice
  }

  const plans = initialPlans ?? []
  const ms = plans.filter((p) => p.plan_type === 'recurring').map(transformPlan).sort(sortByPrice)
  const pg = plans.filter((p) => p.plan_type === 'credit_package' || p.plan_type === 'drop_in').map(transformPlan).sort(sortByPrice)

  const displayMemberships = ms.length > 0 ? ms : fallbackMemberships
  const displayPayGo = pg.length > 0 ? pg : fallbackPayGo

  return (
    <section id="pricing" className={`py-24 bg-[#090909]`}>
      <Container>
        {/* Header */}
        <div>
          <p className="text-brand-blue text-sm font-semibold uppercase tracking-widest mb-3">
            PRICING
          </p>
          <h2 className={`text-4xl sm:text-5xl font-bold uppercase mb-4 text-white`}>
            Simple, Transparent Pricing
          </h2>
          <p className={`text-lg max-w-xl text-white/60`}>
            Flexible membership and pay-as-you-go packages to suit you. No contracts, freedom to cancel any time.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mt-8 mb-10">
          <div className={`flex items-center gap-1 border rounded-full p-1 ${
            'bg-white/5 border-white/10'
          }`}>
            {(['memberships', 'paygo'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                  tab === t
                    ? 'bg-brand-blue text-white'
                    :'text-white/50 hover:text-white'
                }`}
              >
                {t === 'memberships' ? 'Memberships' : 'Pay & Go'}
              </button>
            ))}
          </div>
        </div>



        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(tab === 'memberships' ? displayMemberships : displayPayGo).map((plan, i) => (
            <div key={i}>
              <PricingCard plan={plan as FounderDisplayPlan} isFounder={tab === 'memberships'} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
