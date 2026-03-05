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

        {/* Icon rail */}
        <div
          className="flex flex-col items-center border-r border-sidebar-border bg-sidebar"
          style={{ width: 56, flexShrink: 0, zIndex: 30 }}
        >
          {/* Logo */}
          <div className="flex h-14 w-full items-center justify-center border-b border-sidebar-border">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground select-none overflow-hidden">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="524 480 157 133" className="h-[17px] w-auto" fill="currentColor">
                <path d="m590.98 485.94q0.16 0 0.32 0c9.06-0.01 18.11 0.43 35.26 1.88q3.45 0.33 6.9 0.59 1.94 0.15 3.87 0.35-0.21 1.34-0.52 2.66c-0.04 0.2-0.04 0.2-0.09 0.4q-0.12 0.54-0.25 1.08-0.08 0.34-0.15 0.68-1.14 4.88-2.34 9.74c-0.03 0.11-0.03 0.11-0.05 0.22q-0.29 1.18-0.58 2.35-0.03 0.12-0.06 0.24-0.08 0.29-0.15 0.57-0.13 0-0.28 0c-15.35 0.08-15.35 0.08-47.62 0.38q-0.12 0-0.24 0-1.29 0.04-2.58 0.1-0.13 0.01-0.26 0.02c-2.35 0.12-4.28 1.12-5.96 2.72q-0.22 0.19-0.44 0.37c-0.52 0.45-0.9 1-1.28 1.57-0.09 0.13-0.09 0.13-0.18 0.26-0.65 1.02-0.99 2.1-1.25 3.27q-0.04 0.15-0.08 0.31-0.4 1.88-0.71 3.78-0.04 0.19-0.07 0.39-1.09 6.21-1.97 12.46-0.05 0.35-0.1 0.71c-0.15 1.06-0.29 2.11-0.29 3.18q0 0.11 0 0.23c0 0.38 0.03 0.54 0.25 0.87 0.32 0.05 0.32 0.05 0.7 0.05q0.12 0 0.23 0 0.38 0 0.77 0 0.28 0.01 0.56 0.01 0.79 0 1.58 0.01 0.85 0 1.71 0.01 1.58 0.01 3.17 0.02 2.11 0.01 4.22 0.02 0.3 0.01 0.61 0.01 0.47 0 0.93 0 7.26 0.05 14.52 0.09-0.15 1.21-0.35 2.42-0.04 0.24-0.07 0.48-0.11 0.64-0.21 1.28-0.06 0.4-0.13 0.8-0.19 1.25-0.4 2.5-0.23 1.45-0.46 2.89-0.17 1.12-0.35 2.24-0.11 0.67-0.21 1.34-0.1 0.62-0.2 1.25-0.04 0.23-0.08 0.46-0.05 0.31-0.1 0.63c-0.03 0.17-0.03 0.17-0.06 0.35q-0.1 0.5-0.28 0.98-0.13 0-0.27 0-3.42 0.02-6.83 0.03-1.65 0.01-3.31 0.02-3.37 0.02-6.74 0.04-2.02 0.01-4.04 0.02-1.36 0-2.73 0.01-0.81 0.01-1.62 0.01-0.75 0-1.5 0.01-0.28 0-0.55 0-0.38 0-0.75 0-0.21 0-0.42 0c-0.37 0.04-0.37 0.04-0.61 0.33-0.18 0.29-0.26 0.53-0.33 0.87-0.04 0.17-0.04 0.17-0.08 0.35q-0.04 0.19-0.07 0.38-0.05 0.2-0.09 0.41-0.44 2.23-0.8 4.49-0.07 0.38-0.13 0.77-0.36 2.14-0.71 4.29c-0.03 0.17-0.03 0.17-0.06 0.35q-2.17 13.22-4.28 26.45-0.02 0.16-0.05 0.31-0.27 1.74-0.55 3.48-0.1 0.63-0.2 1.27-0.04 0.25-0.08 0.49-0.02 0.12-0.04 0.24-0.12 0.73-0.23 1.46-0.08 0.48-0.15 0.95-0.04 0.22-0.07 0.44-0.05 0.3-0.1 0.6-0.02 0.17-0.05 0.34c-0.05 0.26-0.05 0.26-0.16 0.37q-0.37 0.01-0.74 0.01c-0.12 0-0.12 0-0.24 0q-0.39 0-0.79 0-0.28 0-0.57 0-0.77 0-1.55 0-0.82 0-1.65 0-1.4 0-2.79 0-1.41 0-2.82 0-8.72 0.02-17.43-0.12 0.08-0.23 0.15-0.46c0.04-0.13 0.04-0.13 0.09-0.26q0.16-0.46 0.36-0.9c0.08-0.18 0.08-0.18 0.16-0.35q0.07-0.18 0.15-0.36 0.16-0.35 0.32-0.7 0.07-0.16 0.14-0.33 0.16-0.35 0.31-0.71 0.15-0.35 0.32-0.71c3.81-8.33 4.58-18.96 5.97-29.07q0.13-0.93 0.28-1.85c0.5-3.05 0.91-6.12 1.31-9.18q0.2-1.58 0.44-3.15 0.54-3.74 0.99-7.49 0.27-2.16 0.57-4.31 0.28-1.94 0.5-3.89 0.2-1.74 0.44-3.48 0.36-2.62 0.66-5.25 0.22-2 0.49-4 0.34-2.54 0.63-5.08 0.15-1.26 0.3-2.52 0.43-3.56 0.82-7.12c0.64-5.82 0.64-5.82 1.25-7.25q0.05-0.1 0.09-0.21 0.49-1.1 1.09-2.16c0.1-0.18 0.1-0.18 0.2-0.37q0.4-0.77 0.87-1.52c0.23-0.34 0.23-0.34 0.33-0.68q0.11 0 0.22 0 0.03-0.11 0.07-0.23c0.17-0.38 0.41-0.68 0.67-1.01q0.08-0.09 0.16-0.2 0.17-0.2 0.33-0.41 0.22-0.26 0.43-0.53c1.25-1.52 2.67-2.99 4.25-4.17q0.18-0.15 0.35-0.29c1.99-1.57 4.22-2.77 6.52-3.8q0.12-0.05 0.24-0.11c5.6-2.52 11.92-3.27 17.99-3.55q0.13-0.01 0.26-0.02 1.02-0.04 2.03-0.08 0.19 0 0.39-0.01 3.92-0.13 7.84-0.12z"/>
                <path d="m646.04 488.44q3.39-0.01 6.78-0.01 1.58 0 3.16 0c12.62-0.02 12.62-0.02 18.64 0.22q-0.31 0.96-0.73 1.88-0.11 0.26-0.23 0.52-0.06 0.13-0.12 0.26-0.54 1.2-1.07 2.39c-0.08 0.17-0.08 0.17-0.16 0.35-0.71 1.62-1.15 3.31-1.56 5.02q-0.03 0.11-0.06 0.23c-1.59 6.56-2.58 13.3-3.6 19.97q-0.02 0.15-0.04 0.29c-1.37 8.97-2.59 17.96-6.33 47.46q-0.02 0.12-0.04 0.25-0.65 5.33-1.26 10.66-0.04 0.36-0.08 0.73-0.18 1.5-0.34 2.99-0.06 0.59-0.13 1.17-0.03 0.26-0.06 0.52c-0.17 1.6-0.5 3.04-1.22 4.49q-0.09 0.17-0.17 0.35c-1.89 3.79-4.38 7.32-7.73 9.95q-0.12 0.1-0.25 0.21-2.14 1.74-4.59 3.02c-0.13 0.07-0.13 0.07-0.27 0.14-2.88 1.53-5.94 2.49-9.09 3.25q-0.16 0.04-0.33 0.08c-2.1 0.51-4.16 0.89-6.32 1.09-0.11 0.01-0.11 0.01-0.23 0.02-9.52 0.88-19.26 0.67-50.08-1.32q-3.28-0.34-6.58-0.54-2.34-0.16-4.67-0.47c0.28-1.73 0.68-3.41 1.1-5.11q0.4-1.62 0.76-3.25 0.28-1.32 0.63-2.61 0.25-0.91 0.46-1.83 0.41-1.72 0.84-3.43 0.2-0.8 0.4-1.6 2.22-0.13 4.44-0.13 0.33 0 0.66 0 0.71-0.01 1.42-0.01 1.14 0 2.28-0.01 1.62 0 3.24-0.01 3.99-0.01 7.98-0.03 0.62 0 1.24 0 6.49-0.03 12.98-0.08 0.19 0 0.38 0c8.34-0.03 8.34-0.03 16.68-0.32q0.21-0.01 0.42-0.02c2.47-0.24 4.86-1.98 6.41-3.84 0.24-0.31 0.41-0.55 0.53-0.92q0.11 0 0.22 0 0.04-0.12 0.09-0.24 0.18-0.42 0.38-0.84c0.63-1.39 0.89-2.84 1.17-4.33 0.03-0.16 0.03-0.16 0.06-0.33 0.82-4.32 1.5-8.67 2.13-13.02q0.05-0.38 0.11-0.77 0.31-2.02 0.5-4.05 0.02-0.16 0.04-0.32c0.06-0.71 0.06-0.71-0.18-1.35-0.32-0.16-0.63-0.13-0.98-0.13q-0.12 0-0.24 0-0.41-0.01-0.82-0.01-0.3 0-0.59-0.01-0.84 0-1.67-0.01-0.53-0.01-1.06-0.01-11.83-0.1-23.65-0.16 0.07-1.19 0.25-2.38c0.02-0.13 0.02-0.13 0.04-0.26q0.07-0.43 0.14-0.86 0.05-0.31 0.1-0.61 0.13-0.8 0.26-1.59 0.13-0.8 0.26-1.61 0.15-0.9 0.3-1.81 0.28-1.72 0.55-3.45 0.15-0.93 0.3-1.86 0.24-1.54 0.48-3.08 1.73-0.02 3.45-0.04 0.31-0.01 0.61-0.01 5.03-0.06 10.05-0.08 0.97 0 1.95-0.01 0.65 0 1.3 0 0.16 0 0.33 0 1.97-0.01 3.94-0.02 1.26 0 2.52-0.01 0.74 0 1.48 0 0.69-0.01 1.37-0.01 0.25 0 0.5 0 0.34 0 0.69 0 0.19 0 0.38-0.01c0.34-0.02 0.57-0.08 0.87-0.24 0.28-0.51 0.41-1.04 0.52-1.61q0.02-0.13 0.04-0.25 0.08-0.42 0.16-0.83c0.03-0.14 0.03-0.14 0.06-0.29q0.64-3.4 1.19-6.82 0.09-0.53 0.18-1.06 1.62-9.85 3.19-19.71 0.02-0.12 0.04-0.25c0.37-2.33 0.37-2.33 0.74-4.65q0.44-2.8 0.89-5.6 0.17-1.06 0.34-2.12 0.17-1.04 0.33-2.07 0.07-0.4 0.13-0.79 0.09-0.55 0.17-1.09 0.03-0.16 0.06-0.33 0.02-0.15 0.04-0.3 0.03-0.13 0.05-0.26c0.04-0.21 0.04-0.21 0.15-0.42z"/>
              </svg>
            </div>
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
          className="flex flex-col border-r border-sidebar-border bg-sidebar overflow-hidden transition-all duration-200"
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
                      <Avatar className="size-8 rounded-md shrink-0">
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
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          {(headerTabs || headerSearch || actions) && (
            <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-6" style={{ zIndex: 20 }}>
              {headerTabs && <div className="flex items-center shrink-0">{headerTabs}</div>}
              <div className="flex items-center gap-2 flex-1">
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
