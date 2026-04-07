import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | Frontline Fitness',
  description: 'Your Frontline Fitness dashboard. View classes, bookings, and manage your account.',
  robots: { index: false, follow: false },
}

export default function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
