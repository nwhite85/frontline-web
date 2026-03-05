'use client'

import Link from 'next/link'

import { Container } from '@/components/ui/container'
import { useLandingTheme } from '@/contexts/LandingThemeContext'

const footerNavLinks = [
  { label: 'Workouts', id: 'workouts' },
  { label: 'Schedule', id: 'schedule' },
  { label: 'Pricing', id: 'pricing' },
  { label: 'Shop', href: '/shop' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
]

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/frontlinefitnessswindon',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61586574820165&locale=en_GB',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
]

export function LandingFooter() {
  const { isDark } = useLandingTheme()
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer
      className={`${isDark ? 'bg-blue-950' : 'bg-[#335ba3]'} py-20`}

    >
      <Container>
        {/* Desktop layout */}
        <div className="hidden md:flex items-center justify-between">
          {/* Logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/frontline-logo-white.svg"
            alt="Frontline Fitness"
            style={{ height: '20px', width: 'auto' }}
          />

          {/* Nav links */}
          <nav className="flex items-center gap-8">
            {footerNavLinks.map((link) =>
              link.id ? (
                <button
                  key={link.label}
                  onClick={() => scrollTo(link.id!)}
                  className="text-white/70 hover:text-white text-sm transition-colors cursor-pointer"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.label}
                  href={link.href!}
                  className="text-white/70 hover:text-white text-sm transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="text-white/60 hover:text-white transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/frontline-logo-white.svg"
            alt="Frontline Fitness"
            style={{ height: '20px', width: 'auto' }}
            className="mb-8"
          />
          <nav className="flex flex-col gap-4 mb-8">
            {footerNavLinks.map((link) =>
              link.id ? (
                <button
                  key={link.label}
                  onClick={() => scrollTo(link.id!)}
                  className="text-white/70 text-sm text-left cursor-pointer hover:text-white transition-colors"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.label}
                  href={link.href!}
                  className="text-white/70 text-sm hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
          <div className="flex items-center gap-6 mb-8">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="text-white/60 hover:text-white transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/10 mt-8" />
        <p className="text-white/50 text-xs mt-6">
          © 2026 Frontline Fitness. All rights reserved.
        </p>
      </Container>
    </footer>
  )
}
