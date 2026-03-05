'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ClientShell from '@/components/client/ClientShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface UserProfile {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  date_of_birth: string | null
  is_active: boolean
  join_date: string | null
  status: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      setEmail(session.user.email ?? '')

      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (data) {
        const p = data as UserProfile; setProfile(p)
        setFirstName(p.first_name ?? '')
        setLastName(p.last_name ?? '')
        setPhone(p.phone ?? '')
      }
      setLoading(false)
    }
    load()
  }, [router])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    await supabase
      .from('user_profiles')
      .update({ first_name: firstName, last_name: lastName, phone } as never)
      .eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <ClientShell>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold uppercase text-white tracking-tight">Profile</h1>
          <p className="text-white/40 mt-1">Manage your account details</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
            {/* Membership status */}
            <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">Membership</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  profile?.is_active ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'
                }`}>
                  {profile?.is_active ? 'Active' : profile?.status === 'lead' ? 'Pending' : 'Inactive'}
                </span>
                {profile?.status && (
                  <span className="text-xs text-white/40 capitalize">{profile.status}</span>
                )}
                {profile?.join_date && (
                  <span className="text-xs text-white/40">
                    Joined {new Date(profile.join_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>

            {/* Edit form */}
            <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-4">Personal details</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">First name</label>
                  <Input
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Last name</label>
                  <Input
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Phone</label>
                  <Input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    type="tel"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Date of birth</label>
                  <Input
                    value={profile?.date_of_birth ?? ''}
                    readOnly
                    disabled
                    className="border-white/10 text-white/40 cursor-not-allowed bg-white/5"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Email</label>
                  <Input
                    value={email}
                    readOnly
                    disabled
                    className="border-white/10 text-white/40 cursor-not-allowed bg-white/5"
                  />
                </div>
                <Button
                  size="xl"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-brand-blue hover:bg-[#3a6fd4] text-white border-0 w-full"
                >
                  {saved ? 'Saved!' : saving ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientShell>
  )
}
