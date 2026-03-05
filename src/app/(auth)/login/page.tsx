'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { logger } from '@/utils/logger'

export default function ClientLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) { setError('Invalid email or password'); return }
      router.push('/client-dashboard')
    } catch (err: unknown) {
      logger.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen text-white flex flex-col relative overflow-hidden" style={{ background: '#0d1f3c' }}>
      {/* Angled dark blue top section */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '60%',
        background: '#000000',
        clipPath: 'polygon(0 0, 100% 0, 100% 65%, 0 100%)',
        pointerEvents: 'none',
      }} />
      {/* Border rails */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="max-w-6xl mx-auto h-full border-x border-[rgba(255,255,255,0.06)]" />
      </div>

      {/* Nav bar */}
      <div className="sticky top-0 z-30 h-16 border-b border-white/10 bg-black">
        <div className="max-w-6xl mx-auto pl-[13px] sm:pl-[21px] lg:pl-[29px] pr-4 sm:pr-6 lg:pr-8 h-full flex items-center">
          <a href="/">
            <img src="/logos/frontline-logo-blue.svg" alt="Frontline Fitness" style={{ height: '20px', width: 'auto' }} />
          </a>
        </div>
      </div>

      {/* Centred form */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md flex flex-col gap-5">
          <div>
            <h2 className="text-2xl font-semibold text-white">Sign in</h2>
            <p className="text-sm text-white/50 mt-1">Sign in to your membership account</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-6 flex flex-col gap-4">
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-white/80">Email</label>
                <Input id="email" type="email" placeholder="name@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  required autoComplete="email"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-white/80">Password</label>
                  <a href="/reset-password" className="text-xs text-white/40 hover:text-white/70 transition-colors">Forgot password?</a>
                </div>
                <Input id="password" type="password" placeholder="Enter your password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="current-password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20" />
              </div>
              {error && (
                <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5">
                  <p className="text-sm text-red-400 font-medium">{error}</p>
                </div>
              )}
              <Button type="submit" size="xl" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
            <p className="text-sm text-white/40 text-center border-t border-white/10 pt-4">
              Don&apos;t have an account?{' '}
              <a href="/signup" className="text-white/70 hover:text-white transition-colors font-medium">Sign up</a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 h-14">
        <div className="max-w-6xl mx-auto pl-[13px] sm:pl-[21px] lg:pl-[29px] pr-4 sm:pr-6 lg:pr-8 h-full flex items-center gap-6">
          <span className="text-xs text-white/30">© Frontline Fitness</span>
          <a href="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">Privacy &amp; Terms</a>
        </div>
      </div>
    </div>
  )
}
