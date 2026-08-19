'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { EVENT } from './event'

export function BookingForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email) && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/event-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventSlug: EVENT.slug, name, email, notes }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) throw new Error(data.error || 'Failed')
      // Off to Stripe — nothing is recorded until the deposit goes through.
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error && err.message !== 'Failed' ? err.message : 'Something went wrong — please try again.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8 flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <p className="text-sm font-medium text-white/80">Deposit</p>
          <p className="text-xs text-white/40 mt-0.5">
            £{EVENT.total.toFixed(2)} a head — balance of £{(EVENT.total - EVENT.deposit).toFixed(2)} nearer the time
          </p>
        </div>
        <span className="text-3xl font-bold text-white tabular-nums">£{EVENT.deposit}</span>
      </div>

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
          <p className="text-xs text-white/35">Your receipt and the rest of the details go here.</p>
        </div>
        <div className="flex flex-col gap-1.5">
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
            placeholder="Dietary requirements, who you'd like to sit with…"
          />
        </div>
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
        {submitting ? 'Taking you to checkout…' : <>Pay my deposit — £{EVENT.deposit} <ChevronRight size={14} /></>}
      </button>
      <p className="text-xs text-white/30 text-center -mt-2">
        Card payment handled by Stripe. One place per booking — book again for anyone else coming.
      </p>
    </form>
  )
}
