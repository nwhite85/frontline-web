'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ClientShellProps {
  children: React.ReactNode
  user?: User | null
}

export default function ClientShell({ children }: ClientShellProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: '#0a0a0f' }}>
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="max-w-6xl mx-auto h-full border-x border-[rgba(255,255,255,0.06)]" />
      </div>
      <div className="sticky top-0 z-30 h-16 border-b border-white/10 bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <a href="/client-dashboard">
            <img src="/logos/frontline-logo-blue.svg" alt="Frontline Fitness" width="80" height="20" style={{ height: '20px', width: 'auto' }} />
          </a>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-white/50 hover:text-white">
            <LogOut className="h-4 w-4 mr-2" />Sign out
          </Button>
        </div>
      </div>
      <div className="relative z-10 flex-1">
        {children}
      </div>
      <div className="relative z-10 h-14 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center gap-6">
          <span className="text-xs text-white/30">© Frontline Fitness</span>
          <a href="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">Privacy &amp; Terms</a>
        </div>
      </div>
    </div>
  )
}
