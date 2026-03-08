'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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

const ITEMS = ['T-Shirt', 'Vest']
const FITS = ["Men's", "Ladies'"]
const SIZES: Record<string, string[]> = {
  "Men's":   ['S', 'M', 'L', 'XL', 'XXL'],
  "Ladies'": ['XS', 'S', 'M', 'L', 'XL'],
}

type Step = 'name' | 'item' | 'fit' | 'size' | 'confirm' | 'done'

export default function MerchPage() {
  const [step, setStep] = useState<Step>('name')
  const [availableNames, setAvailableNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [item, setItem] = useState('')
  const [fit, setFit] = useState('')
  const [size, setSize] = useState('')

  useEffect(() => {
    async function loadClaimed() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from('merch_orders').select('name')
      const claimed = new Set((data || []).map((r: { name: string }) => r.name))
      setAvailableNames(ALL_NAMES.filter(n => !claimed.has(n)))
      setLoading(false)
    }
    loadClaimed()
  }, [])

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any).from('merch_orders').insert({
      name, item, fit, size,
    })
    if (err) {
      setError('Something went wrong — please try again.')
      setSubmitting(false)
    } else {
      setStep('done')
    }
  }

  return (
    <div style={{
      minHeight: '100svh',
      background: '#0a1628',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: '"SohneVar", "Helvetica Neue", Arial, sans-serif',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logos/frontline-logo-white.svg" alt="Frontline Fitness" style={{ height: 36, objectFit: 'contain' }} />
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: '32px 24px',
        width: '100%',
        maxWidth: 480,
      }}>

        {/* DONE */}
        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>You're sorted!</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>
              {name} — {fit} {item}, size {size}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 12 }}>
              Nick will be in touch when it's ready to collect.
            </p>
          </div>
        )}

        {/* STEP: NAME */}
        {step === 'name' && (
          <>
            <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Claim your merch</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24 }}>
              Pick your name to get started. Already claimed names are hidden.
            </p>
            {loading ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading…</p>
            ) : availableNames.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>All orders have been submitted!</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {availableNames.map(n => (
                  <button key={n} onClick={() => { setName(n); setStep('item') }} style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    color: 'white',
                    fontSize: 14,
                    padding: '8px 14px',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.16)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* STEP: ITEM */}
        {step === 'item' && (
          <>
            <Back onClick={() => setStep('name')} />
            <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Hi {name} 👋</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24 }}>What would you like?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ITEMS.map(i => (
                <OptionButton key={i} label={i} onClick={() => { setItem(i); setStep('fit') }} />
              ))}
            </div>
          </>
        )}

        {/* STEP: FIT */}
        {step === 'fit' && (
          <>
            <Back onClick={() => setStep('item')} />
            <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{item}</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24 }}>Which fit?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FITS.map(f => (
                <OptionButton key={f} label={f} onClick={() => { setFit(f); setStep('size') }} />
              ))}
            </div>
          </>
        )}

        {/* STEP: SIZE */}
        {step === 'size' && (
          <>
            <Back onClick={() => setStep('fit')} />
            <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{fit} {item}</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24 }}>What size?</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {SIZES[fit].map(s => (
                <button key={s} onClick={() => { setSize(s); setStep('confirm') }} style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 600,
                  padding: '12px 20px',
                  cursor: 'pointer',
                  minWidth: 60,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.16)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP: CONFIRM */}
        {step === 'confirm' && (
          <>
            <Back onClick={() => setStep('size')} />
            <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Confirm your order</h2>
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 10,
              padding: '16px 20px',
              marginBottom: 24,
              marginTop: 16,
            }}>
              <Row label="Name" value={name} />
              <Row label="Item" value={item} />
              <Row label="Fit" value={fit} />
              <Row label="Size" value={size} />
            </div>
            {error && <p style={{ color: '#f87171', fontSize: 14, marginBottom: 12 }}>{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: '100%',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '14px',
                fontSize: 16,
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {submitting ? 'Submitting…' : 'Submit order'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function Back({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'none',
      border: 'none',
      color: 'rgba(255,255,255,0.4)',
      fontSize: 13,
      cursor: 'pointer',
      padding: '0 0 16px 0',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    }}>
      ← Back
    </button>
  )
}

function OptionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 10,
      color: 'white',
      fontSize: 16,
      fontWeight: 500,
      padding: '14px 20px',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.16)')}
    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
    >
      {label}
    </button>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>{label}</span>
      <span style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>{value}</span>
    </div>
  )
}
