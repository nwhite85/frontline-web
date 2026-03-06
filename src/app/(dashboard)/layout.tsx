'use client'

import { ThemeProvider } from '@/contexts/ThemeContext'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SimpleAuthProvider } from '@/contexts/SimpleAuthContext'
import { AppShell } from '@/components/shell/AppShell'

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  // Auth bypassed for tweakcn preview — restore before going live
  return <AppShell>{children}</AppShell>
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem storageKey="frontline-theme">
        <ThemeProvider>
          <TooltipProvider>
            <SimpleAuthProvider>
              <DashboardLayoutInner>{children}</DashboardLayoutInner>
            </SimpleAuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </NextThemesProvider>
    </>
  )
}
