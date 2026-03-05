'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

interface PlanInfo {
  id: string
  name: string
  price: number
  description?: string
  plan_type?: string
}

const defaultPlan: PlanInfo = {
  id: 'membership',
  name: 'Membership',
  price: 42,
  description: 'Full access — outdoor bootcamp sessions',
}

function SignupContent() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: '', gender: '', password: '', confirm: '',
    terms: false, marketing: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<PlanInfo>(defaultPlan)
  const [planLoading, setPlanLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = (field: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }))

  useEffect(() => {
    const fetchPlan = async () => {
      const planParam = searchParams.get('plan')
      if (!planParam) { setPlanLoading(false); return }
      try {
        const { data: plans, error } = await supabase
          .from('membership_plans')
          .select('*')
          .eq('is_active', true)
        if (error) throw error
        const matched = (plans || []).find((p: PlanInfo) => {
          const slug = p.name.toLowerCase().replace(/\s+/g, '_')
          const slugDash = p.name.toLowerCase().replace(/\s+/g, '-')
          return slug === planParam || slugDash === planParam || p.name === planParam
        })
        if (matched) setSelectedPlan(matched)
      } catch (err) {
        console.error('Error fetching plan:', err)
      } finally {
        setPlanLoading(false)
      }
    }
    fetchPlan()
  }, [searchParams])

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) { setError('Please enter a valid email address'); return }
    setLoading(true)
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', form.email.toLowerCase())
        .single()
      if (data) {
        setError('An account with this email already exists. Please sign in instead.')
        setLoading(false)
        return
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code !== 'PGRST116') {
        console.error('Email check error:', err)
      }
    } finally {
      setLoading(false)
    }
    setStep(2)
  }

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.firstName || !form.lastName) { setError('Please enter your full name'); return }
    if (!form.phone) { setError('Please enter your phone number'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (!form.terms) { setError('Please accept the privacy policy to continue'); return }
    setLoading(true)
    try {
      const signupResponse = await fetch('/api/signup-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: `${form.firstName} ${form.lastName}`,
          phone: form.phone,
          dateOfBirth: form.dateOfBirth || undefined,
          gender: form.gender || undefined,
          planId: selectedPlan.id,
          acceptMarketing: form.marketing,
        }),
      })
      const signupResult = await signupResponse.json()
      if (!signupResponse.ok || !signupResult.success) {
        setError(signupResult.error || 'Failed to create account')
        setLoading(false)
        return
      }
      router.push('/signup/success')
    } catch (err) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const selectStyle = { backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff80' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat' as const, backgroundPosition: 'right 12px center' }

  return (
    <div className="min-h-screen text-white flex flex-col relative overflow-hidden" style={{ background: '#0d1f3c' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '60%', background: '#000000',
        clipPath: 'polygon(0 0, 100% 0, 100% 65%, 0 100%)',
        pointerEvents: 'none',
      }} />
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="max-w-6xl mx-auto h-full border-x border-[rgba(255,255,255,0.06)]" />
      </div>
      <div className="sticky top-0 z-30 h-16 border-b border-white/10 bg-black">
        <div className="max-w-6xl mx-auto pl-[13px] sm:pl-[21px] lg:pl-[29px] pr-4 sm:pr-6 lg:pr-8 h-full flex items-center">
          <a href="/"><img src="/logos/frontline-logo-blue.svg" alt="Frontline Fitness" style={{ height: '20px', width: 'auto' }} /></a>
        </div>
      </div>
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm flex flex-col gap-5">
          <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-6 flex flex-col gap-5">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                {step === 1 ? 'Join Frontline Fitness' : 'Your details'}
              </h2>
              {!planLoading && (
                <div className="flex items-center justify-between mt-2">
                  <p className="text-base text-white/50">Plan: <span className="font-semibold text-white">{selectedPlan.name}</span></p>
                  <p className="text-base font-bold text-brand-blue">£{selectedPlan.price}/mo</p>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                {[1, 2].map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= s ? 'bg-brand-blue text-white' : 'bg-white/10 text-white/30'}`}>{s}</div>
                    {s < 2 && <div className="w-10 h-px bg-white/10" />}
                  </div>
                ))}
              </div>
              {step === 1 && (
                <form onSubmit={handleStep1} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-white/80">Email address</label>
                    <Input id="email" type="email" placeholder="name@example.com"
                      value={form.email} onChange={(e) => update('email', e.target.value)} required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20" />
                  </div>
                  {error && (
                    <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5">
                      <p className="text-sm text-red-400 font-medium">{error}</p>
                    </div>
                  )}
                  <Button type="submit" size="xl" className="w-full" disabled={loading}>{loading ? 'Checking…' : 'Continue'}</Button>
                </form>
              )}
              {step === 2 && (
                <form onSubmit={handleStep2} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="firstName" className="text-sm font-medium text-white/80">First name</label>
                      <Input id="firstName" placeholder="Jane" value={form.firstName}
                        onChange={(e) => update('firstName', e.target.value)} required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="lastName" className="text-sm font-medium text-white/80">Last name</label>
                      <Input id="lastName" placeholder="Smith" value={form.lastName}
                        onChange={(e) => update('lastName', e.target.value)} required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="phone" className="text-sm font-medium text-white/80">Phone number</label>
                    <Input id="phone" type="tel" placeholder="07123 456789" value={form.phone}
                      onChange={(e) => update('phone', e.target.value)} required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="dob" className="text-sm font-medium text-white/80">Date of birth</label>
                    <Input id="dob" type="date" value={form.dateOfBirth}
                      onChange={(e) => update('dateOfBirth', e.target.value)}
                      className="bg-white/5 border-white/10 text-white focus-visible:ring-white/20 [color-scheme:dark]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="gender" className="text-sm font-medium text-white/80">Gender</label>
                    <select id="gender" value={form.gender} onChange={(e) => update('gender', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-white/10 bg-white/5 pl-3 pr-8 py-1 text-sm text-white outline-none appearance-none"
                      style={selectStyle}>
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-sm font-medium text-white/80">Password</label>
                    <Input id="password" type="password" placeholder="At least 8 characters"
                      value={form.password} onChange={(e) => update('password', e.target.value)}
                      required minLength={8}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="confirm" className="text-sm font-medium text-white/80">Confirm password</label>
                    <Input id="confirm" type="password" placeholder="Repeat your password"
                      value={form.confirm} onChange={(e) => update('confirm', e.target.value)} required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="terms" checked={form.terms} onCheckedChange={(v) => update('terms', Boolean(v))} />
                    <label htmlFor="terms" className="text-sm text-white/50 cursor-pointer">
                      I accept the{' '}
                      <a href="/terms" className="text-white/70 hover:text-white transition-colors">terms</a>
                      {' '}and{' '}
                      <a href="/privacy" className="text-white/70 hover:text-white transition-colors">privacy policy</a> *
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="marketing" checked={form.marketing} onCheckedChange={(v) => update('marketing', Boolean(v))} />
                    <label htmlFor="marketing" className="text-sm text-white/50 cursor-pointer">
                      I agree to receive marketing updates via email
                    </label>
                  </div>
                  {error && (
                    <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5">
                      <p className="text-sm text-red-400 font-medium">{error}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button type="button" size="xl" className="flex-1 bg-white/10 hover:bg-white/15 text-white border-white/10" onClick={() => setStep(1)}>Back</Button>
                    <Button type="submit" size="xl" className="flex-2 flex-[2]" disabled={loading}>
                      {loading ? 'Processing…' : 'Continue to payment'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
            {step === 1 && (
              <div className="border-t border-white/10 pt-4">
                <p className="text-sm text-white/50 text-center">
                  Already have an account?{' '}
                  <a href="/login" className="text-white/70 hover:text-white transition-colors font-medium">Sign in</a>
                </p>
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

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1f3c' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
