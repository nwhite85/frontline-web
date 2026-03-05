'use client'

import { useState, useEffect } from 'react'
import { Container } from '@/components/ui/container'
import { supabase } from '@/lib/supabase'
import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLandingTheme } from '@/contexts/LandingThemeContext'

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

const fallbackMemberships: DisplayPlan[] = [
  {
    name: '1 Class',
    price: '£32',
    period: '/month',
    features: ['1 class per week', 'Circuits, Intervals, Strength, Endurance', 'Personal progress tracking', 'Community support'],
    highlighted: false,
    buttonText: 'Get Started',
    slug: '1_class',
  },
  {
    name: '2 Classes',
    price: '£39',
    period: '/month',
    features: ['2 classes per week', 'Circuits, Intervals, Strength, Endurance', 'Personal progress tracking', 'Community support'],
    highlighted: false,
    buttonText: 'Get Started',
    slug: '2_classes',
  },
  {
    name: 'Unlimited',
    price: '£42',
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

function PricingCard({ plan }: { plan: DisplayPlan }) {
  const { isDark } = useLandingTheme()

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
            ? isDark ? 'bg-blue-950/30' : 'bg-brand-blue/5'
            : isDark ? 'bg-white/[0.03]' : 'bg-white'
        }`}
        style={{
          boxShadow: plan.highlighted
            ? isDark
              ? '0 8px 32px rgba(73,130,232,0.25), 0 0 0 1px rgba(73,130,232,0.6), inset 0 0 0 2px rgba(0,0,0,0.35)'
              : '0 8px 32px rgba(73,130,232,0.15), 0 0 0 1px rgba(73,130,232,0.4), inset 0 0 0 2px #ffffff'
            : isDark
            ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.10), inset 0 0 0 2px rgba(0,0,0,0.35)'
            : '0 8px 32px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05), inset 0 0 0 2px #ffffff',
        }}
      >
        <div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-[#0f0f0f]'}`}>{plan.name}</h3>
          <div className="flex items-end gap-1">
            <span className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-[#0f0f0f]'}`}>{plan.price}</span>
            <span className={`text-sm mb-1 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{plan.period}</span>
          </div>
        </div>

        {plan.features.length > 0 && (
          <ul className="space-y-2 flex-1">
            {plan.features.map((f, i) => (
              <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
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
              ? 'bg-brand-blue hover:bg-[#3b72d6] text-white'
              : isDark
              ? 'bg-white/10 hover:bg-white/20 text-white'
              : 'bg-black/5 hover:bg-black/10 text-[#0f0f0f]'
          }`}
        >
          {plan.buttonText}
        </button>
      </div>
    </div>
  )
}

export function LandingPricing() {
  const [tab, setTab] = useState<'memberships' | 'paygo'>('memberships')
  const [memberships, setMemberships] = useState<DisplayPlan[]>([])
  const [payGo, setPayGo] = useState<DisplayPlan[]>([])
  const [loading, setLoading] = useState(true)
  const { isDark } = useLandingTheme()

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (!error && data && data.length > 0) {
        const ms = data.filter((p: Plan) => p.plan_type === 'recurring').map(transformPlan)
        const pg = data
          .filter((p: Plan) => p.plan_type === 'credit_package' || p.plan_type === 'drop_in')
          .map(transformPlan)
          .sort((a: DisplayPlan, b: DisplayPlan) => {
            const aPrice = parseFloat(a.price.replace(/[^0-9.]/g, ''))
            const bPrice = parseFloat(b.price.replace(/[^0-9.]/g, ''))
            return aPrice - bPrice
          })
        setMemberships(ms.length > 0 ? ms : fallbackMemberships)
        setPayGo(pg.length > 0 ? pg : fallbackPayGo)
      } else {
        setMemberships(fallbackMemberships)
        setPayGo(fallbackPayGo)
      }
      setLoading(false)
    }
    fetchPlans()
  }, [])

  const displayMemberships = loading ? fallbackMemberships : memberships
  const displayPayGo = loading ? fallbackPayGo : payGo

  return (
    <section id="pricing" className={`py-24 ${isDark ? 'bg-[#090909]' : 'bg-[#f8f9fa]'}`}>
      <Container>
        {/* Header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          viewport={{ once: true, margin: '-60px' }}
        >
          <p className="text-brand-blue text-sm font-semibold uppercase tracking-widest mb-3">
            PRICING
          </p>
          <h2 className={`text-4xl sm:text-5xl font-bold uppercase mb-4 ${isDark ? 'text-white' : 'text-[#0f0f0f]'}`}>
            Simple, Transparent Pricing
          </h2>
          <p className={`text-lg max-w-xl ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
            Flexible membership and pay-as-you-go packages to suit you. No contracts, freedom to cancel any time.
          </p>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-10">
          <div className={`flex items-center gap-1 border rounded-full p-1 ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
          }`}>
            {(['memberships', 'paygo'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                  tab === t
                    ? 'bg-brand-blue text-white'
                    : isDark
                    ? 'text-white/50 hover:text-white'
                    : 'text-slate-500 hover:text-slate-900'
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
            <motion.div
              key={plan.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.1 }}
              viewport={{ once: true, margin: '-60px' }}
            >
              <PricingCard plan={plan} />
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  )
}
