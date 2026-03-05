import { ThemeProvider } from 'next-themes'
import { SimpleAuthProvider } from '@/contexts/SimpleAuthContext'

export default function DashboardLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SimpleAuthProvider>
        {children}
      </SimpleAuthProvider>
    </ThemeProvider>
  )
}
