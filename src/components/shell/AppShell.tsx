'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Dumbbell,
  Globe,
  MessageSquare,
  Moon,
  Sun,
  Users,
  CreditCard,
  Clock,
  BookOpen,
  MapPin,
  Megaphone,
  Trophy,
  Activity,
  Monitor,
  Smartphone,
  ShoppingBag,
  FileText,
  X,
  ChevronRight,
  LogOut,
  ChevronsUpDown,
  Settings,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PageActionsProvider, usePageActions } from '@/contexts/PageActionsContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { ThemeSettingsSheet } from './ThemeSettingsSheet'

// ─── Nav definition ───────────────────────────────────────────────────────────

interface NavItem { label: string; href: string; icon: React.ElementType }
interface NavModule { id: string; label: string; icon: React.ElementType; items: NavItem[] }

const NAV_MODULES: NavModule[] = [
  {
    id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard,
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Clients', href: '/dashboard/clients', icon: Users },
      { label: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    ],
  },
  {
    id: 'scheduling', label: 'Scheduling', icon: Calendar,
    items: [
      { label: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
      { label: 'Classes', href: '/dashboard/classes', icon: BookOpen },
      { label: 'Appointments', href: '/dashboard/appointments', icon: Clock },
      { label: 'Events', href: '/dashboard/events', icon: Megaphone },
      { label: 'Challenges', href: '/dashboard/challenges', icon: Trophy },
      { label: 'Locations', href: '/dashboard/locations', icon: MapPin },
    ],
  },
  {
    id: 'programming', label: 'Programming', icon: Dumbbell,
    items: [
      { label: 'Exercises', href: '/dashboard/exercises', icon: Dumbbell },
      { label: 'Workouts', href: '/dashboard/workouts', icon: Activity },
      { label: 'Programs', href: '/dashboard/programs', icon: BookOpen },
    ],
  },
  {
    id: 'frontend', label: 'Frontend', icon: Globe,
    items: [
      { label: 'App', href: '/dashboard/app', icon: Smartphone },
      { label: 'Website', href: '/dashboard/website', icon: Monitor },
      { label: 'Shop', href: '/dashboard/shop', icon: ShoppingBag },
      { label: 'Forms', href: '/dashboard/forms', icon: FileText },
    ],
  },
]

function getActiveModule(pathname: string): string {
  if (pathname.startsWith('/dashboard/schedule') || pathname.startsWith('/dashboard/classes') ||
    pathname.startsWith('/dashboard/appointments') || pathname.startsWith('/dashboard/events') ||
    pathname.startsWith('/dashboard/challenges') || pathname.startsWith('/dashboard/locations'))
    return 'scheduling'
  if (pathname.startsWith('/dashboard/exercises') || pathname.startsWith('/dashboard/workouts') ||
    pathname.startsWith('/dashboard/programs'))
    return 'programming'
  if (pathname.startsWith('/dashboard/website') || pathname.startsWith('/dashboard/app') ||
    pathname.startsWith('/dashboard/shop') || pathname.startsWith('/dashboard/forms'))
    return 'frontend'
  return 'dashboard'
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function AppShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { settings, update } = useTheme()
  const { user, logout } = useSimpleAuth()
  const { actions, headerSearch, headerTabs } = usePageActions()

  const [activeModuleId, setActiveModuleId] = useState(() => getActiveModule(pathname))
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [showThemeSettings, setShowThemeSettings] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = settings.mode === 'dark'
  const isChatActive = pathname.startsWith('/dashboard/chat')
  const activeModule = NAV_MODULES.find(m => m.id === activeModuleId) ?? NAV_MODULES[0]

  const handleModuleClick = (moduleId: string) => {
    if (activeModuleId === moduleId) {
      setIsPanelOpen(!isPanelOpen)
    } else {
      setActiveModuleId(moduleId)
      setIsPanelOpen(true)
    }
  }

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U'
  const displayName = user?.name || 'Trainer'

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">

        {/* Mobile top bar */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-2 px-3 bg-sidebar border-b border-sidebar-border">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent transition-colors"
            aria-label="Open navigation"
          >
            <Menu style={{ width: 20, height: 20 }} />
          </button>
          <div className="flex-1" />
          {headerTabs && <div className="flex items-center shrink-0">{headerTabs}</div>}
        </div>

        {/* Mobile nav drawer */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border flex flex-col h-full">
            <SheetHeader className="flex flex-row items-center gap-3 h-14 px-4 border-b border-sidebar-border shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/frontline-logo-blue.svg" alt="Frontline Fitness" width={24} height={24} style={{ width: 24, height: 24, objectFit: 'contain' }} />
              <SheetTitle className="text-sm font-semibold text-sidebar-foreground">Frontline</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 min-h-0">
              <nav className="flex flex-col px-2 py-3 gap-4">
                {NAV_MODULES.map((module) => (
                  <div key={module.id}>
                    <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{module.label}</p>
                    {module.items.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileNavOpen(false)}
                          className={cn(
                            'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          )}
                        >
                          <Icon style={{ width: 15, height: 15 }} className="shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                ))}
              </nav>
            </ScrollArea>
            <div className="border-t border-sidebar-border p-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-sidebar-accent transition-colors">
                    <Avatar className="size-8 rounded-md shrink-0">
                      <AvatarFallback className="rounded-md bg-primary text-primary-foreground text-[11px] font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium leading-none truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email ?? ''}</p>
                    </div>
                    <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" className="w-52">
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => logout()}>
                    <LogOut className="mr-2 size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SheetContent>
        </Sheet>

        {/* Icon rail */}
        <div
          className="hidden lg:flex flex-col items-center border-r border-sidebar-border bg-sidebar"
          style={{ width: 56, flexShrink: 0, zIndex: 30 }}
        >
          {/* Logo */}
          <div className="flex h-14 w-full items-center justify-center border-b border-sidebar-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/frontline-logo-blue.svg"
              alt="Frontline Fitness"
              width={28}
              height={28}
              style={{ width: 28, height: 28, objectFit: 'contain' }}
            />
          </div>

          {/* Module buttons */}
          <div className="flex flex-col items-center gap-1 py-3 flex-1">
            {NAV_MODULES.map((module) => {
              const Icon = module.icon
              const isActive = activeModuleId === module.id
              return (
                <Tooltip key={module.id} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleModuleClick(module.id)}
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-primary'
                          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <Icon style={{ width: 18, height: 18 }} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">{module.label}</TooltipContent>
                </Tooltip>
              )
            })}
          </div>

          {/* Footer actions */}
          <div className="flex flex-col items-center gap-1 pb-3">
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => router.push('/dashboard/chat')}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                    isChatActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <MessageSquare style={{ width: 18, height: 18 }} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Chat</TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => update({ mode: isDark ? 'light' : 'dark' })}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  {mounted ? (isDark ? <Sun style={{ width: 18, height: 18 }} /> : <Moon style={{ width: 18, height: 18 }} />) : <Moon style={{ width: 18, height: 18 }} />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{mounted && isDark ? 'Light mode' : 'Dark mode'}</TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowThemeSettings(v => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  <Settings style={{ width: 18, height: 18 }} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Appearance</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Secondary panel */}
        <div
          className="hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar overflow-hidden transition-all duration-200"
          style={{ width: isPanelOpen ? 200 : 0, flexShrink: 0 }}
        >
          {isPanelOpen && (
            <div className="flex flex-col h-full w-[200px]">
              {/* Panel header */}
              <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
                <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {activeModule.label}
                </span>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>

              {/* Nav items */}
              <ScrollArea className="flex-1 py-2">
                <nav className="flex flex-col gap-0.5 px-2">
                  {activeModule.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href ||
                      (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        )}
                      >
                        <Icon style={{ width: 15, height: 15 }} className="shrink-0" />
                        <span className="truncate">{item.label}</span>
                        {isActive && <ChevronRight style={{ width: 12, height: 12 }} className="ml-auto shrink-0 opacity-60" />}
                      </Link>
                    )
                  })}
                </nav>
              </ScrollArea>

              {/* Account footer */}
              <div className="border-t border-sidebar-border p-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-sidebar-accent transition-colors">
                      <Avatar className="size-8 rounded-md shrink-0 after:rounded-md">
                        <AvatarFallback className="rounded-md bg-primary text-primary-foreground text-[11px] font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium leading-none truncate">{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email ?? ''}</p>
                      </div>
                      <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="end" className="w-52">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => logout()}
                    >
                      <LogOut className="mr-2 size-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>

        {/* Main area */}
        <div className="flex flex-1 flex-col overflow-hidden pt-14 lg:pt-0">
          {/* Header */}
          {(headerTabs || headerSearch || actions) && (
            <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-6" style={{ zIndex: 20 }}>
              {headerTabs && <div className="hidden lg:flex items-center shrink-0">{headerTabs}</div>}
              <div className="flex items-center gap-2 flex-1 min-w-0 max-w-[45%] lg:max-w-none">
                {headerSearch}
              </div>
              <div className="ml-auto flex items-center gap-2">
                {actions}
              </div>
            </header>
          )}

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>

        <ThemeSettingsSheet open={showThemeSettings} onOpenChange={setShowThemeSettings} />
      </div>
    </TooltipProvider>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <PageActionsProvider>
      <AppShellInner>{children}</AppShellInner>
    </PageActionsProvider>
  )
}
