// @ts-nocheck
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useState } from 'react'
import { CalendarDays, Trophy, ShoppingBag, User as UserIcon, LogOut, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href || (href !== '/client-dashboard' && pathname.startsWith(href))

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: '#0a0a0f' }}>

      {/* Top header */}
      <header className="sticky top-0 z-30 h-16 border-b border-white/10 bg-black">
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo — always left */}
          <a href="/client-dashboard">
            <img src="/logos/frontline-logo-blue.png" alt="Frontline Fitness" height={20} style={{ height: '20px', width: 'auto' }} />
          </a>

          {/* Desktop: sign out */}
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden md:flex text-white/50 hover:text-white">
            <LogOut className="h-4 w-4 mr-2" />Sign out
          </Button>

          {/* Mobile: hamburger */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Body: sidebar + main */}
      <div className="relative z-10 flex flex-1">
        {/* Desktop left sidebar */}
        <aside className="hidden md:flex fixed top-16 left-0 h-[calc(100vh-4rem)] w-60 flex-col border-r border-white/10 bg-black z-20">
          <nav className="flex-1 flex flex-col gap-1 p-4 pt-6">
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
          <div className="p-4 border-t border-white/10">
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
        <main className="flex-1 md:ml-60 pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
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
      </nav>

      {/* Mobile full-screen overlay menu — matches landing nav style */}
      <div
        className={`fixed inset-0 z-40 bg-black flex flex-col items-center justify-center gap-8 transition-transform duration-300 md:hidden ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {navItems.map(({ href, label, newTab }) => (
          <a
            key={href}
            href={href}
            target={newTab ? '_blank' : undefined}
            rel={newTab ? 'noopener noreferrer' : undefined}
            onClick={() => setMenuOpen(false)}
            className="text-white text-2xl font-light tracking-wide hover:opacity-70 transition-opacity"
          >
            {label}
          </a>
        ))}
        <button
          onClick={handleSignOut}
          className="mt-4 text-white/50 text-lg font-light tracking-wide hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
