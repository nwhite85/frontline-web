'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2 } from 'lucide-react'

export default function TrainerSignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', specialisation: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { role: 'trainer', name: form.name, specialisation: form.specialisation } },
    })
    if (error) { setError(error.message) } else { setSuccess(true) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#e8edf5' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '60%',
        background: '#ffffff',
        clipPath: 'polygon(0 0, 100% 0, 100% 65%, 0 100%)',
        pointerEvents: 'none',
      }} />
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="max-w-6xl mx-auto h-full border-x border-black/[0.06]" />
      </div>
      <div className="sticky top-0 z-30 h-16 border-b border-black/10 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <a href="/"><img src="/logos/frontline-logo-dark.svg" alt="Frontline Fitness" style={{ height: '20px', width: 'auto' }} /></a>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md flex flex-col gap-5">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Trainer registration</h2>
            <p className="text-sm text-gray-500 mt-1">Create your trainer account to get started</p>
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-6 flex flex-col gap-4 shadow-sm">
            {success ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 border border-green-200">
                  <CheckCircle2 className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Registration submitted</h3>
                  <p className="text-sm text-gray-500 mt-1">Check your email to verify your account.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Full name</label>
                  <label htmlFor="name" className="text-sm font-medium text-white/80">Full name</label>
                  <Input id="name" autoComplete="name" placeholder="Jane Smith" value={form.name} onChange={(e) => update('name', e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <label htmlFor="email" className="text-sm font-medium text-white/80">Email address</label>
                  <Input id="email" type="email" autoComplete="email" placeholder="name@example.com" value={form.email} onChange={(e) => update('email', e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Specialisation</label>
                  <label htmlFor="specialisation" className="text-sm font-medium text-white/80">Specialisation</label>
                  <Input id="specialisation" placeholder="e.g. Strength & Conditioning" value={form.specialisation} onChange={(e) => update('specialisation', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <label htmlFor="password" className="text-sm font-medium text-white/80">Password</label>
                  <Input id="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={8} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Confirm password</label>
                  <label htmlFor="confirm" className="text-sm font-medium text-white/80">Confirm password</label>
                  <Input id="confirm" type="password" autoComplete="new-password" placeholder="Repeat your password" value={form.confirm} onChange={(e) => update('confirm', e.target.value)} required />
                </div>
                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5">
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </div>
                )}
                <Button type="submit" size="xl" className="w-full" disabled={loading}>
                  {loading ? 'Creating account…' : 'Create account'}
                </Button>
              </form>
            )}
            <p className="text-sm text-gray-400 text-center border-t border-gray-100 pt-4">
              Already have an account?{' '}
              <a href="/dashboard-login" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">Sign in</a>
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 h-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center gap-6">
          <span className="text-xs text-gray-400">© Frontline Fitness</span>
          <a href="/privacy" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Privacy &amp; Terms</a>
        </div>
      </div>
    </div>
  )
}
