// @ts-nocheck
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useState } from 'react'
import { CalendarDays, Trophy, ShoppingBag, User as UserIcon, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface ClientShellProps {
  children: React.ReactNode
  user?: User | null
}

const navItems = [
  { href: '/client-dashboard', label: 'Schedule', icon: CalendarDays },
  { href: '/client/results', label: 'Results', icon: Trophy },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/client/profile', label: 'Profile', icon: UserIcon },
]

export default function ClientShell({ children }: ClientShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href || (href !== '/client-dashboard' && pathname.startsWith(href))

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: '#0a0a0f' }}>
      {/* Column border overlay */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="max-w-6xl mx-auto h-full border-x border-[rgba(255,255,255,0.06)]" />
      </div>

      {/* Top header — always visible */}
      <header className="sticky top-0 z-30 h-16 border-b border-white/10 bg-black">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Mobile: centred logo + hamburger */}
          <div className="flex items-center w-full md:hidden">
            {/* Left spacer to centre logo */}
            <div className="w-10" />
            <div className="flex-1 flex justify-center">
              <a href="/client-dashboard">
                <img src="/logos/frontline-logo-blue.png" alt="Frontline Fitness" height={20} style={{ height: '20px', width: 'auto' }} />
              </a>
            </div>
            <button
              onClick={() => setSheetOpen(true)}
              className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Desktop: logo left, sign out right */}
          <div className="hidden md:flex items-center justify-between w-full">
            <a href="/client-dashboard">
              <img src="/logos/frontline-logo-blue.png" alt="Frontline Fitness" height={20} style={{ height: '20px', width: 'auto' }} />
            </a>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-white/50 hover:text-white">
              <LogOut className="h-4 w-4 mr-2" />Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Body: sidebar + main */}
      <div className="relative z-10 flex flex-1">
        {/* Desktop left sidebar */}
        <aside className="hidden md:flex fixed top-16 left-0 h-[calc(100vh-4rem)] w-60 flex-col border-r border-white/10 bg-black z-20">
          <nav className="flex-1 flex flex-col gap-1 p-4 pt-6">
            {navItems.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
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
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <a
              key={href}
              href={href}
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

      {/* Mobile hamburger sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="bg-black border-white/10 text-white w-72">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white text-left">Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                onClick={() => setSheetOpen(false)}
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
          <div className="mt-auto pt-6 border-t border-white/10 absolute bottom-8 left-6 right-6">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
