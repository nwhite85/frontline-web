'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

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
        className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/15 bg-white/5 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <input
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/35"
          placeholder="Search your name…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
        <svg className="w-4 h-4 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-xl">
          <div className="max-h-56 overflow-y-auto">
            {filtered.map(n => (
              <button
                key={n}
                className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                onMouseDown={() => { onSelect(n); setOpen(false); setQuery('') }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
      {open && filtered.length === 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/40 shadow-xl">
          No names found
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

  if (done) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6">
            <Image src="/logos/frontline-logo-fitness-white.svg" alt="Frontline Fitness" width={160} height={40} className="mx-auto" />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-xl font-bold text-white mb-2">Order received!</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Thanks <span className="text-white font-medium">{name}</span> — your {fit} {item === 'tshirt' ? 'T-Shirt' : 'Vest'} in size <span className="text-white font-medium">{size}</span> has been noted. We&apos;ll be in touch.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image src="/logos/frontline-logo-fitness-white.svg" alt="Frontline Fitness" width={160} height={40} className="mx-auto" />
          <p className="text-white/40 text-sm mt-3">Founding Member — Free Merch</p>
        </div>

        <div className="flex items-center gap-1.5 mb-6">
          {([1, 2, 3, 4] as const).map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-[#4982e8]' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

          {/* Step 1: Name */}
          {step === 1 && (
            <div>
              <h2 className="text-white font-semibold text-lg mb-1">Who are you?</h2>
              <p className="text-white/50 text-sm mb-4">Select your name from the list.</p>
              <NamePicker available={available} onSelect={(n) => { setName(n); setStep(2) }} />
              {available.length === 0 && (
                <p className="text-white/40 text-sm text-center mt-4">All orders have been submitted.</p>
              )}
            </div>
          )}

          {/* Step 2: Item */}
          {step === 2 && (
            <div>
              <button onClick={() => setStep(1)} className="text-white/40 text-xs mb-4 hover:text-white/60 transition-colors">← Back</button>
              <h2 className="text-white font-semibold text-lg mb-1">Hi {name.split(' ')[0]}!</h2>
              <p className="text-white/50 text-sm mb-5">Which item would you like?</p>
              <div className="flex flex-col gap-3">
                {[{ value: 'tshirt', label: 'T-Shirt', desc: 'Classic crew neck tee' }, { value: 'vest', label: 'Vest', desc: 'Sleeveless training vest' }].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setItem(opt.value); setStep(3) }}
                    className="flex items-center gap-4 px-4 py-4 rounded-xl border border-white/10 hover:border-[#4982e8]/50 hover:bg-[#4982e8]/5 transition-all text-left"
                  >
                    <div>
                      <p className="text-white font-medium text-sm">{opt.label}</p>
                      <p className="text-white/40 text-xs mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Fit */}
          {step === 3 && (
            <div>
              <button onClick={() => setStep(2)} className="text-white/40 text-xs mb-4 hover:text-white/60 transition-colors">← Back</button>
              <h2 className="text-white font-semibold text-lg mb-1">Which fit?</h2>
              <p className="text-white/50 text-sm mb-5">Choose your preferred cut.</p>
              <div className="flex flex-col gap-3">
                {[{ value: "Men's", label: "Men's fit" }, { value: "Ladies'", label: "Ladies' fit" }].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setFit(opt.value); setStep(4) }}
                    className="flex items-center gap-4 px-4 py-4 rounded-xl border border-white/10 hover:border-[#4982e8]/50 hover:bg-[#4982e8]/5 transition-all text-left"
                  >
                    <p className="text-white font-medium text-sm">{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Size */}
          {step === 4 && (
            <div>
              <button onClick={() => setStep(3)} className="text-white/40 text-xs mb-4 hover:text-white/60 transition-colors">← Back</button>
              <h2 className="text-white font-semibold text-lg mb-1">What size?</h2>
              <p className="text-white/50 text-sm mb-5">{fit} {item === 'tshirt' ? 'T-Shirt' : 'Vest'} sizing.</p>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${size === s ? 'bg-[#4982e8] border-[#4982e8] text-white' : 'border-white/10 text-white/70 hover:border-white/30 hover:text-white'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={!size || submitting}
                className="w-full py-3 rounded-xl bg-[#4982e8] text-white font-medium text-sm hover:bg-[#4982e8]/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting…' : 'Confirm Order'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
