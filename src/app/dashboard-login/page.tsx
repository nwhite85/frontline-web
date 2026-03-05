'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { logger } from '@/utils/logger'

export default function DashboardLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useSimpleAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const success = await login(email, password)
      if (success) { router.push('/dashboard') }
      else { setError('Invalid email or password') }
    } catch (err: unknown) {
      logger.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
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
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Trainer sign in</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to your trainer dashboard</p>
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-6 flex flex-col gap-4 shadow-sm">
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                <Input id="email" type="email" placeholder="name@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  required autoComplete="email" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                  <a href="/reset-password" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Forgot password?</a>
                </div>
                <Input id="password" type="password" placeholder="Enter your password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="current-password" />
              </div>
              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}
              <Button type="submit" size="xl" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </div>
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
