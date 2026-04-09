'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Supabase client automatically picks up the access_token from the URL hash
    // or exchanges the PKCE code — wait for the auth state to settle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true)
      } else if (event === 'SIGNED_OUT' || !session) {
        setSessionReady(false)
      }
    })

    // Also check immediately in case already settled
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      setDone(true)
      setTimeout(() => router.push('/client-dashboard'), 2500)
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#e8edf5' }}>
      {/* Angled white top section */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '60%',
        background: '#ffffff',
        clipPath: 'polygon(0 0, 100% 0, 100% 65%, 0 100%)',
        pointerEvents: 'none',
      }} />
      {/* Border rails */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="max-w-6xl mx-auto h-full border-x border-black/[0.06]" />
      </div>
      {/* Nav */}
      <div className="sticky top-0 z-30 h-16 border-b border-black/10 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <a href="/">
            <img src="/logos/frontline-logo-dark.svg" alt="Frontline Fitness" style={{ height: '20px', width: 'auto' }} />
          </a>
        </div>
      </div>

      {/* Centred form */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md flex flex-col gap-5">
          {done ? (
            <div className="rounded-xl border border-black/10 bg-white p-6 flex flex-col gap-3 shadow-sm text-center">
              <p className="text-lg font-semibold text-gray-900">Password updated</p>
              <p className="text-sm text-gray-500">Redirecting you to the app…</p>
            </div>
          ) : sessionReady === false ? (
            <>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Link expired</h2>
                <p className="text-sm text-gray-500 mt-1">This password reset link is invalid or has expired.</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-600">Please request a new password reset from the app and try again.</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Set new password</h2>
                <p className="text-sm text-gray-500 mt-1">Choose a new password for your Frontline Fitness account</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-white p-6 flex flex-col gap-4 shadow-sm">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700">New password</label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="confirm" className="text-sm font-medium text-gray-700">Confirm password</label>
                    <Input
                      id="confirm"
                      type="password"
                      placeholder="Repeat your new password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  {error && (
                    <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5">
                      <p className="text-sm text-red-600 font-medium">{error}</p>
                    </div>
                  )}
                  <Button type="submit" size="xl" className="w-full" disabled={loading || sessionReady === null}>
                    {loading ? 'Updating…' : 'Set password'}
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 h-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center gap-6">
          <span className="text-xs text-gray-400">© Frontline Fitness</span>
          <a href="/privacy" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Privacy &amp; Terms</a>
        </div>
      </div>
    </div>
  )
}
