'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)
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
            : errorDesc?.replace(/\+/g, ' ') ?? 'Invalid reset link.'
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

      // No token — maybe they navigated here directly
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
    setLoading(true); setError(null)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      setTimeout(() => router.push('/client-dashboard'), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0d1f3c' }}>
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '60%',
          background: '#000000',
          clipPath: 'polygon(0 0, 100% 0, 100% 65%, 0 100%)',
          pointerEvents: 'none',
        }}
      />
      <div className="relative z-10 w-full max-w-sm flex flex-col gap-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Set new password</h1>
          <p className="text-sm text-white/50 mt-1">Choose a new password for your account</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-6 flex flex-col gap-4">
          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5">
              <p className="text-sm text-red-400">{error}</p>
              {error.includes('expired') && (
                <Link href="/login" className="text-sm text-blue-400 underline mt-1 block">
                  Back to login
                </Link>
              )}
            </div>
          )}

          {done && (
            <div className="rounded-md bg-green-500/10 border border-green-500/20 px-3 py-2.5">
              <p className="text-sm text-green-400">Password updated! Redirecting…</p>
            </div>
          )}

          {ready && !done && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/80">New password</label>
                <Input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/80">Confirm password</label>
                <Input
                  type="password"
                  placeholder="Repeat your new password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving…' : 'Set new password'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
