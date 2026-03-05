'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

async function redirectByUserType(userId: string, router: ReturnType<typeof useRouter>) {
  const { data } = await supabase
    .from('user_profiles')
    .select('id, user_type')
    .eq('id', userId)
    .single()

  const profile = data as { user_type?: string } | null
  if (profile?.user_type === 'client') {
    router.push('/client-dashboard')
  } else {
    router.push('/dashboard')
  }
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))

        const errorCode = urlParams.get('error') || urlParams.get('error_code') || hashParams.get('error')
        const errorDesc = urlParams.get('error_description') || hashParams.get('error_description')
        const type = urlParams.get('type') || hashParams.get('type')

        if (type === 'recovery') { router.push('/client/setup'); return }
        if (errorCode === 'otp_expired' || errorCode === 'access_denied') { router.push('/client/setup'); return }
        if (errorCode) { setError(`Authentication failed: ${errorDesc || errorCode}`); return }

        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) { await redirectByUserType(session.user.id, router); return }

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            await redirectByUserType(session.user.id, router)
            authListener.subscription.unsubscribe()
          }
        })

        setTimeout(() => {
          setError('Authentication timed out. Please try again.')
          authListener.subscription.unsubscribe()
        }, 10000)
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('An unexpected error occurred.')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        {error ? (
          <>
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 w-full">
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
            <Button size="xl" className="w-full" onClick={() => router.push('/login')}>
              Return to sign in
            </Button>
          </>
        ) : (
          <>
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
            <p className="text-sm text-white/40">Completing sign in…</p>
          </>
        )}
      </div>
    </div>
  )
}
