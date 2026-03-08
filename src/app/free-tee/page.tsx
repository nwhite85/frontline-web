'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

const ALL_NAMES = [
  'Andrew S', 'Carla F', 'Charlotte M', 'Clair L', 'Dani C', 'Danny D',
  'Dean F', 'Deborah M', 'Denise K', 'Dianne A', 'Donna K', 'Donna M',
  'Duncan F', 'Emily M', 'Fay H', 'Gazz A', 'Glynn I', 'Hannah S',
  'Hannah Y', 'Helen G', 'Helen T', 'Iain H', 'John F', 'John H',
  'Jon M', 'Katherine M', 'Katya K', 'Katy S', 'Katy T', 'Kim C',
  'Lesley M', 'Lisa K', 'Lisa P', 'Liv K', 'Louise J', 'Lou J',
  'Lucy M', 'Lydia C', 'Magdalena M', 'Martin F', 'Mela V', 'Mel P',
  'Michael C', 'Neil R', 'Olivia M', 'Paul S', 'Peter B', 'Rachel B',
  'Rebecca B', 'Richard S', 'Ross B', 'Sarah M', 'Scott P', 'Simon M',
  'Stuart M', 'Suzanne E', 'Tim H', 'Tony C', 'Tracey H', 'Vladimir M',
  'Will H', 'Yaw B', 'Zsuzsi L',
]

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']

function NamePicker({ available, onSelect }: { available: string[], onSelect: (n: string) => void }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = available.filter(n => n.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 cursor-text"
        onClick={() => setOpen(true)}
      >
        <input
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
          placeholder="Search your name…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
        <svg className="w-4 h-4 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-[#0a0f1a] border border-white/10 rounded-lg overflow-hidden shadow-xl">
          {filtered.length > 0 ? (
            <div className="max-h-52 overflow-y-auto">
              {filtered.map(n => (
                <button
                  key={n}
                  className="w-full text-left px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  onMouseDown={() => { onSelect(n); setOpen(false); setQuery('') }}
                >
                  {n}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-3 text-sm text-white/40">No names found</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function FounderMerchPage() {
  const [submitted, setSubmitted] = useState<string[]>([])
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [name, setName] = useState('')
  const [item, setItem] = useState('')
  const [fit, setFit] = useState('')
  const [size, setSize] = useState('')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/merch-order')
      .then(r => r.json())
      .then((data: { name: string }[]) => {
        if (Array.isArray(data)) setSubmitted(data.map(d => d.name))
      })
      .catch(() => {})
  }, [])

  const available = ALL_NAMES.filter(n => !submitted.includes(n))

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/merch-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, item, fit, size }),
      })
      if (!res.ok) throw new Error('Failed')
      setDone(true)
    } catch {
      setError('Something went wrong — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen text-white flex flex-col relative overflow-hidden" style={{ background: '#0d1f3c' }}>
      {/* Angled dark top section */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '60%',
        background: '#000000',
        clipPath: 'polygon(0 0, 100% 0, 100% 65%, 0 100%)',
        pointerEvents: 'none',
      }} />

      {/* Border rails */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="max-w-6xl mx-auto h-full border-x border-[rgba(255,255,255,0.06)]" />
      </div>

      {/* Nav */}
      <div className="sticky top-0 z-30 h-16 border-b border-white/10 bg-black">
        <div className="max-w-6xl mx-auto pl-[13px] sm:pl-[21px] lg:pl-[29px] pr-4 sm:pr-6 lg:pr-8 h-full flex items-center">
          <a href="/">
            <img src="/logos/frontline-logo-blue.svg" alt="Frontline Fitness" width="80" height="20" style={{ height: '20px', width: 'auto' }} />
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md flex flex-col gap-5">

          {done ? (
            <>
              <div>
                <h2 className="text-2xl font-semibold text-white">Order received!</h2>
                <p className="text-sm text-white/50 mt-1">Thanks for ordering your free tee/vest</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-6">
                <p className="text-sm text-white/70 leading-relaxed">
                  Thanks <span className="text-white font-medium">{name}</span> — your {fit} {item === 'tshirt' ? 'T-Shirt' : 'Vest'} in size <span className="text-white font-medium">{size}</span> has been noted. We&apos;ll be in touch when it&apos;s ready.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Product image */}
              <div className="w-full overflow-hidden rounded-xl">
                <img src="/images/founder-tee.png" alt="Frontline Fitness Tee &amp; Vest" className="w-full object-cover scale-110" />
              </div>

              <div className="flex items-start gap-3">
                {step > 1 && (
                  <button
                    onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}
                    className="mt-1 flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                    aria-label="Back"
                  >
                    <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <div>
                  <h2 className="text-2xl font-semibold text-white">Order your free vest or tee</h2>
                  <p className="text-sm text-white/50 mt-1">
                    {step === 1 && 'Select your name to get started'}
                    {step === 2 && `Hi ${name.split(' ')[0]}! Choose your item`}
                    {step === 3 && 'Choose your preferred fit'}
                    {step === 4 && 'Almost done — pick your size'}
                  </p>
                </div>
              </div>

              {/* Step bar */}
              <div className="flex items-center gap-1.5">
                {([1, 2, 3, 4] as const).map(s => (
                  <div key={s} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${s <= step ? 'bg-[#4982e8]' : 'bg-white/10'}`} />
                ))}
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-6 flex flex-col gap-4">

                {/* Step 1: Name */}
                {step === 1 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-white/80">Your name</label>
                      <NamePicker available={available} onSelect={n => { setName(n); setStep(2) }} />
                    </div>
                    {available.length === 0 && (
                      <p className="text-sm text-white/40 text-center py-2">All orders have been submitted.</p>
                    )}
                  </div>
                )}

                {/* Step 2: Item */}
                {step === 2 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      {[{ value: 'tshirt', label: 'T-Shirt', desc: 'Classic crew neck tee' }, { value: 'vest', label: 'Vest', desc: 'Sleeveless training vest' }].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setItem(opt.value); setStep(3) }}
                          className="flex items-center justify-between px-4 py-3.5 rounded-lg border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all text-left"
                        >
                          <div>
                            <p className="text-white font-medium text-sm">{opt.label}</p>
                            <p className="text-white/40 text-xs mt-0.5">{opt.desc}</p>
                          </div>
                          <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Fit */}
                {step === 3 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      {[{ value: "Men's", label: "Men's fit" }, { value: "Ladies'", label: "Ladies' fit" }].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setFit(opt.value); setStep(4) }}
                          className="flex items-center justify-between px-4 py-3.5 rounded-lg border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all text-left"
                        >
                          <p className="text-white font-medium text-sm">{opt.label}</p>
                          <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Size */}
                {step === 4 && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-white/80">Size — {fit} {item === 'tshirt' ? 'T-Shirt' : 'Vest'}</label>
                      <div className="grid grid-cols-4 gap-2">
                        {SIZES.map(s => (
                          <button
                            key={s}
                            onClick={() => setSize(s)}
                            className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                              size === s
                                ? 'bg-[#4982e8] border-[#4982e8] text-white'
                                : 'border-white/10 text-white/60 hover:border-white/25 hover:text-white bg-white/5'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    {error && (
                      <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5">
                        <p className="text-sm text-red-400">{error}</p>
                      </div>
                    )}
                    <Button
                      size="xl"
                      className="w-full"
                      onClick={handleSubmit}
                      disabled={!size || submitting}
                    >
                      {submitting ? 'Submitting…' : 'Confirm Order'}
                    </Button>
                  </div>
                )}

              </div>
            </>
          )}
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
