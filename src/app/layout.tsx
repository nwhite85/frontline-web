import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { CookieConsent } from '@/components/CookieConsent'

export const metadata: Metadata = {
  title: 'Frontline Fitness | Forces-Led Outdoor Training in Swindon',
  description: 'Outdoor fitness bootcamp in Swindon. Forces-led group training, personal training, and online booking.',
  keywords: 'outdoor fitness Swindon, bootcamp Swindon, HIIT training, personal training Swindon, group fitness, military fitness',
  authors: [{ name: 'Frontline Fitness' }],
  openGraph: {
    title: 'Frontline Fitness | Forces-Led Outdoor Training in Swindon',
    description: 'Outdoor fitness bootcamp in Swindon. Forces-led group training, personal training, and online booking.',
    url: 'https://frontlinefitness.co.uk',
    siteName: 'Frontline Fitness',
    images: [
      {
        url: 'https://frontlinefitness.co.uk/photos/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Frontline Fitness outdoor bootcamp training in Swindon',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Frontline Fitness | Forces-Led Outdoor Training in Swindon',
    description: 'Outdoor fitness bootcamp in Swindon. Forces-led group training, personal training, and online booking.',
    images: ['https://frontlinefitness.co.uk/photos/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: 'https://frontlinefitness.co.uk',
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <Toaster />
        <CookieConsent />
      </body>
    </html>
  )
}
