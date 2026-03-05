import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop | Frontline Fitness',
  description: 'Frontline Fitness branded kit and gear. T-shirts, hoodies, and training equipment.',
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children
}
