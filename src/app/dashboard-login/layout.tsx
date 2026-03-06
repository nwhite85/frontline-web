import { ThemeProvider } from 'next-themes'
import { SimpleAuthProvider } from '@/contexts/SimpleAuthContext'

export default function DashboardLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="frontline-theme">
      <SimpleAuthProvider>
        {children}
      </SimpleAuthProvider>
    </ThemeProvider>
  )
}
