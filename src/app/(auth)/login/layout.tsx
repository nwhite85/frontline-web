import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Log In | Frontline Fitness',
  description: 'Log in to your Frontline Fitness account.',
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
