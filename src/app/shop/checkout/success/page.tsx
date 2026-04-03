'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { writeCart } from '@/lib/cart'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [notified, setNotified] = useState(false)

  useEffect(() => {
    // Clear cart on success
    writeCart([])

    // Notify Nick via the shop-order API (email + DB record)
    if (sessionId && !notified) {
      setNotified(true)
      fetch('/api/shop-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {})
    }
  }, [sessionId, notified])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center gap-6">
      <img src="/logos/frontline-logo-blue.png" alt="Frontline Fitness" style={{ height: 24, width: 'auto' }} />
      <div className="flex flex-col gap-3 max-w-sm">
        <div className="text-4xl">✅</div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">Payment confirmed!</h1>
        <p className="text-white/50">
          Thanks for your order. Nick will be in touch to arrange collection at the park.
        </p>
      </div>
      <a href="/shop" className="text-sm text-brand-blue hover:opacity-80 transition-opacity">
        Back to shop
      </a>
    </div>
  )
}

export default function ShopOrderSuccessPage() {
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
