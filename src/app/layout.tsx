import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { CookieConsent } from '@/components/CookieConsent'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  title: 'Frontline Fitness | Forces-Led Outdoor Training in Swindon',
  description: 'Outdoor fitness bootcamp in Swindon. Forces-led group training, personal training, and online booking. Sessions at Lydiard Park — all levels welcome, first session free.',
  keywords: 'outdoor fitness Swindon, bootcamp Swindon, HIIT training, personal training Swindon, group fitness, military fitness, Lydiard Park fitness, outdoor bootcamp Wiltshire, fitness classes Swindon, forces fitness, forces-led training',
  authors: [{ name: 'Frontline Fitness' }],
  openGraph: {
    title: 'Frontline Fitness | Forces-Led Outdoor Training in Swindon',
    description: 'Outdoor fitness bootcamp in Swindon. Forces-led group training, personal training, and online booking. First session free.',
    url: 'https://frontlinefitness.co.uk',
    siteName: 'Frontline Fitness',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Frontline Fitness | Forces-Led Outdoor Training in Swindon',
    description: 'Outdoor fitness bootcamp in Swindon. Forces-led group training and personal training. First session free.',
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
      <head>
        <link rel="preload" href="/fonts/sohne-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/photos/img_tug10.webp" as="image" type="image/webp" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': ['LocalBusiness', 'SportsActivityLocation'],
                '@id': 'https://frontlinefitness.co.uk/#business',
                name: 'Frontline Fitness',
                description: 'Forces-led outdoor fitness bootcamp in Swindon. Group training, personal training, and bootcamp sessions at Lydiard Park. All fitness levels welcome.',
                url: 'https://frontlinefitness.co.uk',
                image: 'https://frontlinefitness.co.uk/photos/og-image.jpg',
                telephone: '+447361579678',
                email: 'info@frontlinefitness.co.uk',
                priceRange: '££',
                currenciesAccepted: 'GBP',
                paymentAccepted: 'Card, Direct Debit',
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: 'Lydiard Park',
                  addressLocality: 'Swindon',
                  postalCode: 'SN5 3PA',
                  addressRegion: 'Wiltshire',
                  addressCountry: 'GB',
                },
                geo: {
                  '@type': 'GeoCoordinates',
                  latitude: 51.5424,
                  longitude: -1.8241,
                },
                areaServed: {
                  '@type': 'City',
                  name: 'Swindon',
                },
                openingHoursSpecification: [
                  {
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                    opens: '06:00',
                    closes: '20:00',
                  },
                ],
                makesOffer: [
                  {
                    '@type': 'Offer',
                    name: 'Bootcamp Membership',
                    description: 'Unlimited outdoor bootcamp sessions per month',
                    price: '38.00',
                    priceCurrency: 'GBP',
                    availability: 'https://schema.org/InStock',
                  },
                  {
                    '@type': 'Offer',
                    name: 'Free Trial Session',
                    description: 'First bootcamp session completely free — no commitment',
                    price: '0',
                    priceCurrency: 'GBP',
                    availability: 'https://schema.org/InStock',
                  },
                ],
                sameAs: [
                  'https://www.facebook.com/profile.php?id=61586574820165&locale=en_GB',
                  'https://www.instagram.com/frontlinefitness.co.uk/',
                ],
              },
            ]),
          }}
        />
        <meta name="geo.region" content="GB-WIL" />
        <meta name="geo.placename" content="Swindon, Wiltshire" />
        <meta name="geo.position" content="51.5424;-1.8241" />
        <meta name="ICBM" content="51.5424, -1.8241" />
      </head>
      <body suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-md focus:text-sm focus:font-medium">
          Skip to main content
        </a>
        {children}
        <Analytics />
        <SpeedInsights />
        <Toaster />
        <CookieConsent />
      </body>
    </html>
  )
}
