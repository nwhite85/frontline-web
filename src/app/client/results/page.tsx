'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ClientShell from '@/components/client/ClientShell'
import { Trophy, Dumbbell } from 'lucide-react'

interface ChallengeResult {
  id: string
  challenge_id: string
  result_data: Record<string, unknown> | null
  primary_result_value: string | null
  recorded_at: string
  challenge: {
    name: string
    icon: string | null
    result_fields: unknown
  } | null
}

type Tab = 'challenges' | 'pbs'

export default function ResultsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('challenges')
  const [results, setResults] = useState<ChallengeResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const userId = session.user.id
      const { data } = await supabase
        .from('challenge_results')
        .select(`
          id,
          challenge_id,
          result_data,
          primary_result_value,
          recorded_at,
          challenge:challenges (
            name,
            icon,
            result_fields
          )
        `)
        .eq('client_id', userId)
        .order('recorded_at', { ascending: false })

      if (data) setResults(data as ChallengeResult[])
      setLoading(false)
    }
    init()
  }, [router])

  const pillClass = (active: boolean) =>
    active
      ? 'px-4 py-1.5 rounded-full text-sm font-medium bg-brand-blue text-white transition-colors'
      : 'px-4 py-1.5 rounded-full text-sm font-medium bg-white/10 text-white/50 hover:bg-white/15 transition-colors'

  return (
    <ClientShell>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <h1 className="text-4xl font-bold uppercase text-white tracking-tight mb-2">Results</h1>
        <p className="text-white/40 mb-8">Your challenge results and personal bests.</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button className={pillClass(tab === 'challenges')} onClick={() => setTab('challenges')}>
            Challenges
          </button>
          <button className={pillClass(tab === 'pbs')} onClick={() => setTab('pbs')}>
            Personal Bests
          </button>
        </div>

        {/* Challenges tab */}
        {tab === 'challenges' && (
          <>
            {loading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-[#0a0f1a] p-5 animate-pulse">
                    <div className="flex gap-4">
                      <div className="h-10 w-10 rounded-full bg-white/10 shrink-0" />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="h-4 w-40 bg-white/10 rounded" />
                        <div className="h-3 w-24 bg-white/10 rounded" />
                        <div className="h-3 w-32 bg-white/10 rounded mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <Trophy className="h-10 w-10 text-white opacity-20" />
                <p className="text-white font-semibold text-lg">No challenge results yet.</p>
                <p className="text-white/40 text-sm max-w-xs">Complete a challenge with your trainer to see your results here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {results.map((result) => (
                  <div key={result.id} className="rounded-xl border border-white/10 bg-[#0a0f1a] p-5">
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/10 border border-brand-blue/20 shrink-0">
                        <Trophy className="h-5 w-5 text-brand-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white">{result.challenge?.name ?? 'Challenge'}</p>
                          <p className="text-xs text-white/40 shrink-0">
                            {new Date(result.recorded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        {result.primary_result_value && (
                          <p className="text-brand-blue font-bold text-lg mt-1">{result.primary_result_value}</p>
                        )}
                        {result.result_data && Object.keys(result.result_data).length > 0 && (
                          <div className="mt-3 flex flex-col gap-1.5">
                            {Object.entries(result.result_data).map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between gap-4">
                                <span className="text-xs text-white/40 capitalize">{key.replace(/_/g, ' ')}</span>
                                <span className="text-xs text-white/80 font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Personal Bests tab */}
        {tab === 'pbs' && (
          <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
            <Dumbbell className="h-10 w-10 text-white opacity-20" />
            <div>
              <p className="text-white font-semibold text-lg mb-2">Personal Bests</p>
              <p className="text-white/40 text-sm max-w-xs">Your personal bests will appear here once you&apos;ve logged workouts with your trainer.</p>
            </div>
            <div className="bg-brand-blue/10 border border-brand-blue/20 rounded-xl p-4">
              <p className="text-sm text-brand-blue font-medium">Coming soon</p>
            </div>
          </div>
        )}
      </div>
    </ClientShell>
  )
}
