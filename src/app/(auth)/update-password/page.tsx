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
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      const errorCode = params.get('error_code')
      const errorDesc = params.get('error_description')

      if (errorCode) {
        setError(
          errorCode === 'otp_expired'
            ? 'This reset link has expired. Please request a new one.'
            : (errorDesc?.replace(/\+/g, ' ') ?? 'Invalid reset link.')
        )
        return
      }

      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      const type = params.get('type')

      if (access_token && refresh_token && type === 'recovery') {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token })
        if (error) {
          setError('Invalid or expired reset link. Please request a new one.')
          return
        }
        setReady(true)
        return
      }

      // No hash — check if already have a valid session (e.g. logged-in user changing password)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setReady(true)
      } else {
        setError('No valid reset session. Please request a new password reset link.')
      }
    }
    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/login') }
  }

  return (
    <div className="min-h-screen text-white flex flex-col relative overflow-hidden" style={{ background: '#0d1f3c' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '60%',
        background: '#000000',
        clipPath: 'polygon(0 0, 100% 0, 100% 65%, 0 100%)',
        pointerEvents: 'none',
      }} />
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="max-w-6xl mx-auto h-full border-x border-[rgba(255,255,255,0.06)]" />
      </div>
      <div className="sticky top-0 z-30 h-16 border-b border-white/10 bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <a href="/"><img src="/logos/frontline-logo-blue.png" alt="Frontline Fitness" width="80" height="20" style={{ height: '20px', width: 'auto' }} /></a>
        </div>
      </div>
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm flex flex-col gap-5">
          <div>
            <h2 className="text-2xl font-semibold text-white">Set new password</h2>
            <p className="text-sm text-white/50 mt-1">Choose a new password for your account</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-6 flex flex-col gap-4">
            {error && (
              <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5">
                <p className="text-sm text-red-400">{error}</p>
                {error.includes('expired') || error.includes('No valid') ? (
                  <a href="/reset-password" className="text-sm text-blue-400 underline mt-1 block">Request a new link</a>
                ) : null}
              </div>
            )}

            {ready && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-white/80">New password</label>
                  <Input id="password" type="password" placeholder="At least 8 characters"
                    value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="confirm" className="text-sm font-medium text-white/80">Confirm password</label>
                  <Input id="confirm" type="password" placeholder="Repeat your password"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Updating…' : 'Update password'}
                </Button>
              </form>
            )}

            {!ready && !error && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="relative z-10 h-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center gap-6">
          <span className="text-xs text-white/30">© Frontline Fitness</span>
          <a href="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">Privacy &amp; Terms</a>
        </div>
      </div>
    </div>
  )
}
