'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ClientShell from '@/components/client/ClientShell'
import { CreditCard } from 'lucide-react'

export default function PaymentsPage() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
    })
  }, [router])

  return (
    <ClientShell>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold uppercase text-white tracking-tight">Payments</h1>
          <p className="text-white/40 mt-1">Payment history will appear here.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-blue/10 border border-brand-blue/20">
            <CreditCard className="h-10 w-10 text-brand-blue" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">No payment history</h2>
            <p className="text-white/40 text-sm">Your payment history will appear here.</p>
          </div>
          <div className="bg-brand-blue/10 border border-brand-blue/20 rounded-xl p-4 max-w-sm w-full text-center">
            <p className="text-sm text-brand-blue font-medium">Connect Stripe to view payment history</p>
            <p className="text-xs text-white/40 mt-1">Payment integration is coming soon.</p>
          </div>
        </div>
      </div>
    </ClientShell>
  )
}
