'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2 } from 'lucide-react'
import ClientShell from '@/components/client/ClientShell'

type Step = 1 | 2

export default function ClientSetupPage() {
  const [step, setStep] = useState<Step>(1)
  const [personal, setPersonal] = useState({ dob: '', phone: '', emergency: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const hashFragment = window.location.hash.substring(1)
      const hashParams = new URLSearchParams(hashFragment)
      const access_token = hashParams.get('access_token')
      const refresh_token = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      if (access_token && refresh_token && type === 'recovery') {
        const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
        if (error) { setError('Invalid setup link. Please request a new invitation.'); return }
        setUserId(data.user?.id ?? null)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
      } else {
        router.push('/login')
      }
    }
    init()
  }, [router])

  const updatePersonal = (field: string, value: string) =>
    setPersonal((p) => ({ ...p, [field]: value }))

  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (userId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = supabase as any
        const { error } = await client
          .from('user_profiles')
          .update({
            date_of_birth: personal.dob || null,
            phone: personal.phone || null,
            emergency_contact_name: personal.emergency || null,
          })
          .eq('id', userId)
        if (error) { setError(error.message); setLoading(false); return }
      }
      setStep(2)
    } catch (err) {
      console.error('Error saving personal info:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { label: 'Personal info', num: 1 },
    { label: 'Confirmation', num: 2 },
  ]

  return (
    <ClientShell>
      <div className="flex-1 flex items-center justify-center px-6 sm:px-8 lg:px-12 py-12">
        <div className="w-full max-w-lg flex flex-col gap-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= s.num ? 'bg-brand-blue text-white' : 'bg-white/10 text-white/30'}`}>
                  {s.num}
                </div>
                <span className={`text-sm ${step === s.num ? 'text-white' : 'text-white/30'}`}>{s.label}</span>
                {i < steps.length - 1 && <div className="w-6 h-px bg-white/10" />}
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5">
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {step === 1 && 'Personal information'}
                {step === 2 && 'All done!'}
              </h2>
              <p className="text-sm text-white/50 mt-1">
                {step === 1 && 'We need a few details to keep you safe.'}
                {step === 2 && 'Your profile is set up and ready to go.'}
              </p>
            </div>

            {step === 1 && (
              <form onSubmit={handlePersonalSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="dob" className="text-sm font-medium text-white/80">Date of birth</label>
                  <Input id="dob" type="date" value={personal.dob}
                    onChange={(e) => updatePersonal('dob', e.target.value)} required
                    className="bg-white/5 border-white/10 text-white focus-visible:ring-white/20" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className="text-sm font-medium text-white/80">Phone number</label>
                  <Input id="phone" type="tel" placeholder="+44 7700 900000" value={personal.phone}
                    onChange={(e) => updatePersonal('phone', e.target.value)} required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="emergency" className="text-sm font-medium text-white/80">Emergency contact</label>
                  <Input id="emergency" placeholder="Name and phone number" value={personal.emergency}
                    onChange={(e) => updatePersonal('emergency', e.target.value)} required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Saving…' : 'Continue'}
                </Button>
              </form>
            )}

            {step === 2 && (
              <div className="flex flex-col items-center gap-6 py-4">
                <CheckCircle2 className="h-12 w-12 text-green-400" />
                <p className="text-sm text-white/50 text-center">
                  Your profile is ready. Head to your dashboard to book your first class.
                </p>
                <Button className="w-full" onClick={() => router.push('/client-dashboard?setup=complete')}>
                  Go to dashboard
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientShell>
  )
}
