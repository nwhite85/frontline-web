import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join | Frontline Fitness',
  description: 'Sign up for Frontline Fitness outdoor bootcamp sessions in Swindon. Flexible membership plans.',
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
