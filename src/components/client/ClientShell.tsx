// @ts-nocheck
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { CalendarDays, Trophy, ShoppingBag, User as UserIcon, LogOut } from 'lucide-react'

interface ClientShellProps {
  children: React.ReactNode
  user?: User | null
}

const navItems = [
  { href: '/client-dashboard', label: 'Schedule', icon: CalendarDays, newTab: false },
  { href: '/client/results', label: 'Results', icon: Trophy, newTab: false },
  { href: '/shop', label: 'Shop', icon: ShoppingBag, newTab: true },
  { href: '/client/profile', label: 'Profile', icon: UserIcon, newTab: false },
]

export default function ClientShell({ children }: ClientShellProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href || (href !== '/client-dashboard' && pathname.startsWith(href))

  return (
    <div className="min-h-screen text-white flex flex-col md:flex-row" style={{ background: '#0a0a0f' }}>

      {/* Desktop left sidebar — no top bar on desktop */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-60 flex-col border-r border-white/10 bg-black z-20">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-white/10 shrink-0">
          <a href="/client-dashboard">
            <img src="/logos/frontline-logo-blue.png" alt="Frontline Fitness" height={20} style={{ height: '20px', width: 'auto' }} />
          </a>
        </div>
        <nav className="flex-1 flex flex-col gap-1 p-4 pt-4">
          {navItems.map(({ href, label, icon: Icon, newTab }) => (
            <a
              key={href}
              href={href}
              target={newTab ? '_blank' : undefined}
              rel={newTab ? 'noopener noreferrer' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(href)
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </a>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60 pb-[84px] md:pb-0">
        {children}
      </main>

      {/* Mobile bottom tab bar — 5 items including sign out */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-black border-t border-white/10 flex">
        {navItems.map(({ href, label, icon: Icon, newTab }) => {
          const active = isActive(href)
          return (
            <a
              key={href}
              href={href}
              target={newTab ? '_blank' : undefined}
              rel={newTab ? 'noopener noreferrer' : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors"
            >
              <Icon className={`h-5 w-5 ${active ? 'text-brand-blue' : 'text-white/40'}`} />
              <span className={`text-[10px] font-medium ${active ? 'text-brand-blue' : 'text-white/40'}`}>
                {label}
              </span>
            </a>
          )
        })}
        {/* Sign out tab */}
        <button
          onClick={handleSignOut}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors"
        >
          <LogOut className="h-5 w-5 text-white/40" />
          <span className="text-[10px] font-medium text-white/40">Sign out</span>
        </button>
      </nav>
    </div>
  )
}
