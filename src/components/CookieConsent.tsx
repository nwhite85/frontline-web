'use client'

import { useState, useEffect } from 'react'
import { Fingerprint, X } from 'lucide-react'

export function CookieConsent() {
  const [show, setShow] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      const timer = setTimeout(() => {
        setShow(true)
        setExpanded(false)
      }, 2000)
      return () => clearTimeout(timer)
    } else {
      // Already consented — show icon only (so they can revisit)
      setShow(true)
      setExpanded(false)
    }
  }, [])

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setExpanded(false)
  }

  const reject = () => {
    localStorage.setItem('cookie-consent', 'rejected')
    setExpanded(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-5 left-5 z-[9999] flex flex-col items-start gap-2">
      {/* Expanded panel */}
      {expanded && (
        <div className="w-72 rounded-xl border border-white/10 bg-black/95 backdrop-blur-sm p-4 shadow-xl">
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="text-sm text-white/70 leading-relaxed">
              We use cookies to enhance your experience.{' '}
              <a href="/privacy" className="text-brand-blue underline hover:opacity-80 transition-opacity">
                Privacy Policy
              </a>
            </p>
            <button onClick={() => setExpanded(false)} className="text-white/30 hover:text-white/60 transition-colors shrink-0 mt-0.5">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={reject}
              className="flex-1 px-3 py-1.5 rounded-lg border border-white/15 text-xs font-medium text-white/60 hover:bg-white/5 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={accept}
              className="flex-1 px-3 py-1.5 rounded-lg bg-brand-blue text-xs font-medium text-white hover:opacity-90 transition-opacity"
            >
              Accept
            </button>
          </div>
        </div>
      )}

      {/* Fingerprint icon button */}
      <button
        onClick={() => setExpanded(v => !v)}
        aria-label="Cookie preferences"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-black/80 border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 backdrop-blur-sm transition-all shadow-lg"
      >
        <Fingerprint className="h-5 w-5" />
      </button>
    </div>
  )
}
