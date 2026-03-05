'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const WARNING_MS = 25 * 60 * 1000 // 25 minutes (5 min warning)
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']

export function useSessionTimeout() {
  const [showWarning, setShowWarning] = useState(false)
  const [expired, setExpired] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(TIMEOUT_MS)
  const lastActivityRef = useRef(Date.now())
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const expireTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const countdownRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (expireTimerRef.current) clearTimeout(expireTimerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }, [])

  const startTimers = useCallback(() => {
    clearTimers()
    lastActivityRef.current = Date.now()
    setShowWarning(false)
    setTimeRemaining(TIMEOUT_MS)

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true)
      // Start countdown updates every second
      countdownRef.current = setInterval(() => {
        const remaining = TIMEOUT_MS - (Date.now() - lastActivityRef.current)
        setTimeRemaining(Math.max(0, remaining))
      }, 1000)
    }, WARNING_MS)

    expireTimerRef.current = setTimeout(() => {
      setExpired(true)
      setShowWarning(false)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }, TIMEOUT_MS)
  }, [clearTimers])

  const extendSession = useCallback(() => {
    setExpired(false)
    startTimers()
  }, [startTimers])

  useEffect(() => {
    const handleActivity = () => {
      // Only reset if not expired and not in warning state
      if (!expired) {
        startTimers()
      }
    }

    // Throttle activity events
    let throttleTimer: ReturnType<typeof setTimeout> | null = null
    const throttledHandler = () => {
      if (throttleTimer) return
      throttleTimer = setTimeout(() => {
        throttleTimer = null
        handleActivity()
      }, 5000) // Only reset every 5 seconds max
    }

    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, throttledHandler, { passive: true })
    })

    startTimers()

    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, throttledHandler)
      })
      clearTimers()
      if (throttleTimer) clearTimeout(throttleTimer)
    }
  }, [expired, startTimers, clearTimers])

  return { showWarning, expired, timeRemaining, extendSession }
}
