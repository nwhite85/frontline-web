'use client'

import { useEffect } from 'react'

/**
 * Detects Supabase recovery tokens in the URL hash and redirects to /update-password.
 * Supabase ignores the redirectTo option and always uses the project site URL (homepage),
 * so the recovery token lands on the homepage as:
 *   https://frontlinefitness.co.uk/#access_token=...&type=recovery
 * This component catches that and routes to the correct update-password page.
 */
export function RecoveryRedirect() {
  useEffect(() => {
    const hash = window.location.hash.substring(1)
    if (!hash) return
    const params = new URLSearchParams(hash)
    // Valid recovery token — redirect to update-password with hash intact
    if (params.get('type') === 'recovery' && params.get('access_token')) {
      window.location.replace('/update-password' + window.location.hash)
      return
    }
    // Expired/invalid recovery link — Supabase sends error params in the hash
    if (params.get('error_code') || params.get('error')) {
      window.location.replace('/update-password' + window.location.hash)
    }
  }, [])
  return null
}
