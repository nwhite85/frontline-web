'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'

type SessionPackage = Database['public']['Tables']['session_packages']['Row']
type MembershipPlan = Database['public']['Tables']['membership_plans']['Row']

interface Plan {
  id: string
  name: string
  price: number
  description?: string | null
}

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen text-white flex flex-col relative overflow-hidden" style={{ background: '#0d1f3c' }}>
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      height: '60%', background: '#000000',
      clipPath: 'polygon(0 0, 100% 0, 100% 65%, 0 100%)',
      pointerEvents: 'none',
    }} />
    <div className="fixed inset-0 pointer-events-none z-40">
      <div className="max-w-6xl mx-auto h-full border-x border-[rgba(255,255,255,0.06)]" />
    </div>
    <div className="sticky top-0 z-30 h-16 border-b border-white/10 bg-black">
      <div className="max-w-6xl mx-auto pl-[13px] sm:pl-[21px] lg:pl-[29px] pr-4 sm:pr-6 lg:pr-8 h-full flex items-center">
        <a href="/"><img src="/logos/frontline-logo-blue.png" alt="Frontline Fitness" width="80" height="20" style={{ height: '20px', width: 'auto' }} /></a>
      </div>
    </div>
    <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
      {children}
    </div>
    <div className="relative z-10 h-14">
      <div className="max-w-6xl mx-auto pl-[13px] sm:pl-[21px] lg:pl-[29px] pr-4 sm:pr-6 lg:pr-8 h-full flex items-center gap-6">
        <span className="text-xs text-white/30">© Frontline Fitness</span>
        <a href="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">Privacy &amp; Terms</a>
      </div>
    </div>
  </div>
)

function CheckoutContent() {
  const searchParams = useSearchParams()
  const planParam = searchParams.get('plan')
  const packageId = searchParams.get('package')

  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        if (packageId) {
          const { data, error } = await supabase
            .from('session_packages')
            .select('*')
            .eq('id', packageId)
            .eq('is_active', true)
            .single()
          if (error) throw error
          const pkg = data as SessionPackage
          setPlan({ id: pkg.id, name: pkg.name, price: pkg.price, description: pkg.description })
        } else if (planParam) {
          const { data: plans, error } = await supabase
            .from('membership_plans')
            .select('*')
            .eq('is_active', true)
          if (error) throw error
          const matched = (plans as MembershipPlan[] || []).find((p) => {
            const slugDash = p.name.toLowerCase().replace(/\s+/g, '-')
            const slugUnd = p.name.toLowerCase().replace(/\s+/g, '_')
            return slugDash === planParam.toLowerCase() || slugUnd === planParam.toLowerCase() || p.name === planParam
          })
          if (matched) {
            setPlan({ id: matched.id, name: matched.name, price: matched.price, description: matched.description })
          } else {
            setError('Plan not found')
          }
        } else {
          setLoading(false)
          return
        }
      } catch (err) {
        console.error('Error fetching plan:', err)
        setError('Could not load plan details')
      } finally {
        setLoading(false)
      }
    }
    fetchPlan()
  }, [planParam, packageId])

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!plan) return
    setProcessing(true)
    setError(null)
    try {
      setError('Payment integration pending. TODO: add /api/create-subscription-checkout route.')
    } catch (err) {
      console.error('Checkout error:', err)
      setError('Failed to start checkout. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <PageShell>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </PageShell>
    )
  }

  if (!plan && !planParam && !packageId) {
    return (
      <PageShell>
        <div className="max-w-sm w-full text-center flex flex-col items-center gap-4">
          <p className="text-white/50">No plan selected.</p>
          <Button variant="outline" onClick={() => window.history.back()}>Go back</Button>
        </div>
      </PageShell>
    )
  }

  if (error && !plan) {
    return (
      <PageShell>
        <div className="max-w-sm w-full text-center flex flex-col items-center gap-4">
          <p className="text-red-400">{error}</p>
          <Button variant="outline" onClick={() => window.history.back()}>Go back</Button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="w-full max-w-sm flex flex-col gap-5">
        <div>
          <h2 className="text-2xl font-semibold text-white">Complete booking</h2>
          {plan && (
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm text-white/50">Plan: <span className="font-medium text-white">{plan.name}</span></p>
              <p className="text-sm font-semibold text-primary">£{plan.price}</p>
            </div>
          )}
          {plan?.description && <p className="text-xs text-white/50 mt-1">{plan.description}</p>}
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-6 flex flex-col gap-4">
          <form onSubmit={handleCheckout} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5">
                <p className="text-sm text-red-400 font-medium">{error}</p>
              </div>
            )}
            <div className="rounded-md bg-yellow-500/10 border border-yellow-500/20 px-3 py-2.5">
              <p className="text-xs text-yellow-400">
                Stripe payment pending — add <code className="font-mono">/api/create-subscription-checkout</code> to complete.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={processing || !plan}>
              {processing ? 'Redirecting to payment…' : `Pay £${plan?.price ?? '—'}`}
            </Button>
          </form>
        </div>
      </div>
    </PageShell>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1f3c' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
