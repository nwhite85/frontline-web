import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { SimpleAuthProvider } from '@/contexts/SimpleAuthContext'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function DashboardLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="frontline-theme">
      <SimpleAuthProvider>
        {children}
      </SimpleAuthProvider>
    </ThemeProvider>
  )
}
