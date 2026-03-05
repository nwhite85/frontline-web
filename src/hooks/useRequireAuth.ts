import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface UseRequireAuthOptions {
  redirectTo?: string
}

export function useRequireAuth({ redirectTo = '/login' }: UseRequireAuthOptions = {}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push(redirectTo)
        return
      }
      setUser(session.user)
      setLoading(false)
    }
    check()
  }, [router, redirectTo])

  return { user, loading }
}
