'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check } from 'lucide-react'
import { EVENT } from '../event'

function SuccessContent() {
  const sessionId = useSearchParams().get('session_id')
  const [state, setState] = useState<{ status: 'loading' | 'paid' | 'unconfirmed'; name?: string }>({ status: 'loading' })

  useEffect(() => {
    if (!sessionId) {
      setState({ status: 'unconfirmed' })
      return
    }
    // Confirms with Stripe and records the booking if the webhook hasn't yet.
    fetch(`/api/event-checkout?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => r.json())
      .then(d => setState(d.paid ? { status: 'paid', name: d.name } : { status: 'unconfirmed' }))
      .catch(() => setState({ status: 'unconfirmed' }))
  }, [sessionId])

  const firstName = state.name?.trim().split(/\s+/)[0]

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="sticky top-0 z-30 h-16 border-b border-white/10 bg-black">
        <div className="max-w-6xl mx-auto pl-[13px] sm:pl-[21px] lg:pl-[29px] pr-4 sm:pr-6 lg:pr-8 h-full flex items-center">
          <a href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/frontline-logo-blue.png" alt="Frontline Fitness" width="80" height="20" style={{ height: '20px', width: 'auto' }} />
          </a>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md text-center">
          {state.status === 'loading' && (
            <div className="w-8 h-8 mx-auto rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
          )}

          {state.status === 'paid' && (
            <>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-blue/15 mb-5">
                <Check size={22} className="text-brand-blue" />
              </div>
              <h1 className="text-3xl font-bold uppercase tracking-tight text-white mb-3">You&apos;re booked on</h1>
              <p className="text-white/60 leading-relaxed">
                {firstName ? `Thanks ${firstName} — your` : 'Your'} place at the {EVENT.name} on{' '}
                <span className="text-white font-medium">{EVENT.date}</span> is paid for.
                Your receipt is on its way by email, and we&apos;ll send the final
                details nearer the time.
              </p>
            </>
          )}

          {state.status === 'unconfirmed' && (
            <>
              <h1 className="text-3xl font-bold uppercase tracking-tight text-white mb-3">Payment not confirmed</h1>
              <p className="text-white/60 leading-relaxed mb-6">
                We couldn&apos;t confirm this payment. If money has left your account
                you are booked on — drop Nick a message and he&apos;ll check.
              </p>
              <a href="/summer-splashdown" className="text-sm text-brand-blue hover:opacity-80 transition-opacity">
                Back to the Splashdown
              </a>
            </>
          )}
        </div>
      </div>

      <div className="h-14 border-t border-white/10">
        <div className="max-w-6xl mx-auto pl-[13px] sm:pl-[21px] lg:pl-[29px] pr-4 sm:pr-6 lg:pr-8 h-full flex items-center gap-6">
          <span className="text-xs text-white/30">© Frontline Fitness</span>
          <a href="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">Privacy &amp; Terms</a>
        </div>
      </div>
    </div>
  )
}

export default function SplashdownSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
