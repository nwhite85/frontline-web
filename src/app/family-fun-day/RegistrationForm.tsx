'use client'

import { useState } from 'react'
import { Check, ChevronRight, Minus, Plus } from 'lucide-react'
import { EVENT } from './event'

function Counter({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {hint && <p className="text-xs text-white/40 mt-0.5">{hint}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex items-center justify-center w-9 h-9 rounded-full border border-white/15 text-white/70 hover:border-white/40 hover:text-white disabled:opacity-25 disabled:hover:border-white/15 transition-colors"
          aria-label={`Fewer ${label.toLowerCase()}`}
        >
          <Minus size={14} />
        </button>
        <span className="w-6 text-center text-lg font-semibold text-white tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex items-center justify-center w-9 h-9 rounded-full border border-white/15 text-white/70 hover:border-white/40 hover:text-white disabled:opacity-25 disabled:hover:border-white/15 transition-colors"
          aria-label={`More ${label.toLowerCase()}`}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}

export function RegistrationForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [childAges, setChildAges] = useState('')
  const [waiver, setWaiver] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const canSubmit = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email) && waiver && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/event-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventSlug: EVENT.slug,
          name,
          email,
          phone,
          adults,
          children,
          childAges,
          waiverAccepted: waiver,
          notes,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error && err.message !== 'Failed' ? err.message : 'Something went wrong — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-blue/15 mb-4">
          <Check size={22} className="text-brand-blue" />
        </div>
        <h3 className="text-2xl font-bold uppercase tracking-tight text-white mb-2">You&apos;re on the list</h3>
        <p className="text-white/60 text-sm leading-relaxed max-w-md mx-auto">
          Thanks {name.trim().split(/\s+/)[0]} — we&apos;ve got you down for{' '}
          <span className="text-white font-medium">
            {adults} {adults === 1 ? 'adult' : 'adults'}
            {children > 0 && ` and ${children} ${children === 1 ? 'child' : 'children'}`}
          </span>
          . We&apos;ll email you nearer the time with the final details.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8 flex flex-col gap-6">
      {/* Your details */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-white/80">Your name</label>
          <input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="px-3.5 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-brand-blue/60 transition-colors placeholder:text-white/25"
            placeholder="First and last name"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-white/80">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="px-3.5 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-brand-blue/60 transition-colors placeholder:text-white/25"
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-sm font-medium text-white/80">
              Phone <span className="text-white/30 font-normal">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="px-3.5 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-brand-blue/60 transition-colors placeholder:text-white/25"
              placeholder="07…"
            />
          </div>
        </div>
      </div>

      {/* Who's coming */}
      <div className="flex flex-col gap-4 border-t border-white/[0.08] pt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-blue">Who&apos;s coming</p>
        <Counter label="Adults" hint={`${EVENT.childAgeCutoff + 1} and over, including you`} value={adults} min={1} max={20} onChange={setAdults} />
        <Counter label="Children" hint={`${EVENT.childAgeCutoff} and under`} value={children} min={0} max={20} onChange={setChildren} />
        {children > 0 && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="childAges" className="text-sm font-medium text-white/80">
              Ages of the children <span className="text-white/30 font-normal">(optional)</span>
            </label>
            <input
              id="childAges"
              value={childAges}
              onChange={e => setChildAges(e.target.value)}
              className="px-3.5 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-brand-blue/60 transition-colors placeholder:text-white/25"
              placeholder="e.g. 4, 7 and 11"
            />
            <p className="text-xs text-white/35">Helps us pitch the assault course and games right.</p>
          </div>
        )}
      </div>

      {/* Anything else */}
      <div className="flex flex-col gap-1.5 border-t border-white/[0.08] pt-6">
        <label htmlFor="notes" className="text-sm font-medium text-white/80">
          Anything we should know? <span className="text-white/30 font-normal">(optional)</span>
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          maxLength={500}
          className="px-3.5 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-brand-blue/60 transition-colors placeholder:text-white/25 resize-none"
          placeholder="Allergies, arriving late, bringing the dog…"
        />
      </div>

      {/* Waiver */}
      <div className="border-t border-white/[0.08] pt-6">
        <label className="flex items-start gap-3 cursor-pointer group">
          <span className="relative flex items-center justify-center shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={waiver}
              onChange={e => setWaiver(e.target.checked)}
              required
              className="peer appearance-none w-5 h-5 rounded border border-white/20 bg-white/5 checked:bg-brand-blue checked:border-brand-blue transition-colors cursor-pointer"
            />
            <Check size={13} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
          </span>
          <span className="text-sm text-white/60 leading-relaxed group-hover:text-white/75 transition-colors">
            I&apos;m happy for the children in my party to take part, and I understand that
            I&apos;m responsible for supervising them throughout the day. Frontline Fitness
            is not responsible for supervising children, and activities are taken part in
            at our own risk.
          </span>
        </label>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3.5 py-2.5">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue/85 disabled:opacity-30 disabled:hover:bg-brand-blue text-white rounded-full px-8 py-3.5 text-sm font-semibold transition-colors"
      >
        {submitting ? 'Registering…' : <>Register for the Fun Day <ChevronRight size={14} /></>}
      </button>
      <p className="text-xs text-white/30 text-center -mt-2">
        Free to attend. We&apos;ll only use your details for this event.
      </p>
    </form>
  )
}
