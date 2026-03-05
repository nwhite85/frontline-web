'use client'

import { useState } from 'react'
import Link from 'next/link'

import { Container } from '@/components/ui/container'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { useLandingTheme } from '@/contexts/LandingThemeContext'

const navLinks = [
  { label: 'Workouts', id: 'workouts' },
  { label: 'Schedule', id: 'schedule' },
  { label: 'Pricing', id: 'pricing' },
]

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/frontlinefitness.co.uk/',
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

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isDark } = useLandingTheme()

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black sm:border-b sm:border-white/15">
        <Container className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img
                src="/logos/frontline-logo-blue.svg"
                alt="Frontline Fitness"
                height={20}
                style={{ height: '20px', width: 'auto' }}
              />
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="text-white/80 hover:text-white px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
              <a
                href="/shop"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1"
              >
                Shop
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>

            {/* Desktop right */}
            <div className="hidden md:flex items-center gap-2">
<button
                onClick={() => scrollTo('booking')}
                className="text-sm px-4 py-2 rounded-full border border-white/30 text-white hover:bg-white/10 transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Mobile hamburger / close */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileOpen(v => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </Container>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black flex flex-col items-center justify-center gap-8 transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {navLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => scrollTo(link.id)}
            className="text-white text-2xl font-light tracking-wide cursor-pointer hover:opacity-70 transition-opacity"
          >
            {link.label}
          </button>
        ))}
        <a
          href="/shop"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white text-2xl font-light tracking-wide hover:opacity-70 transition-opacity"
          onClick={() => setMobileOpen(false)}
        >
          Shop
        </a>
        <button
          onClick={() => scrollTo('booking')}
          className="mt-4 bg-white text-black rounded-full px-8 py-3 text-base font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Try a Free Class
        </button>

<div className="flex items-center gap-6 mt-4">
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
    </>
  )
}
