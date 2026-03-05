'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'

export type CardStyle = 'single-border' | 'inset-highlight' | 'outline'
export type RadiusSize = '0px' | '6px' | '12px' | '16px'
export type ShadowIntensity = 'none' | 'light' | 'medium'
export type UISize = 'sm' | 'default' | 'lg'
export type TableStyle = 'contained' | 'full-bleed'
export type ColorMode = 'light' | 'dark' | 'system'
export type LightBackground = 'white' | 'tinted' | 'dark-tinted' | 'pure'

export interface ThemeSettings {
  cardStyle: CardStyle
  radius: RadiusSize
  shadow: ShadowIntensity
  primaryColor: string
  uiSize: UISize
  mode: ColorMode
  neutralColor: string
  lightBackground: LightBackground
  tableStyle: TableStyle
}

const DEFAULTS: ThemeSettings = {
  cardStyle: 'inset-highlight',
  radius: '12px',
  shadow: 'light',
  primaryColor: '#4982e8',
  uiSize: 'default',
  mode: 'light',
  neutralColor: 'auto',
  lightBackground: 'tinted',
  tableStyle: 'contained',
}

const STORAGE_KEY = 'backline-theme-settings'

type RGB = { r: number; g: number; b: number }

function hexToRgb(hex: string): RGB | null {
  const cleaned = hex.replace('#', '').trim()
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null
  const int = Number.parseInt(cleaned, 16)
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  }
}

function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
    case g: h = ((b - r) / d + 2) / 6; break
    case b: h = ((r - g) / d + 4) / 6; break
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const r = Math.round(hue2rgb(p, q, h / 360 + 1/3) * 255)
  const g = Math.round(hue2rgb(p, q, h / 360) * 255)
  const bv = Math.round(hue2rgb(p, q, h / 360 - 1/3) * 255)
  const toHex = (v: number) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(bv)}`
}

function mix(a: RGB, b: RGB, weight: number): RGB {
  return {
    r: a.r * (1 - weight) + b.r * weight,
    g: a.g * (1 - weight) + b.g * weight,
    b: a.b * (1 - weight) + b.b * weight,
  }
}

/** Generate chart palette from Foundation semantic colours */
function chartPalette(primaryHex: string): string[] {
  return [
    primaryHex,  // Primary (theme-driven)
    '#15BE53',   // Emerald
    '#FFAD00',   // Amber
    '#FF4F40',   // Crimson
    '#635BFF',   // Violet
  ]
}

function relativeLuminance({ r, g, b }: RGB): number {
  const toLin = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const R = toLin(r)
  const G = toLin(g)
  const B = toLin(b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

function load(): ThemeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = { ...DEFAULTS, ...JSON.parse(raw) } as Record<string, unknown>
    // Backwards compat: old value was "double-border"
    if ((parsed.cardStyle as string) === 'double-border') parsed.cardStyle = 'inset-highlight'
    // Backwards compat: 'subtle' was an old value — migrate to 'light'; 'none' is now valid
    if ((parsed.shadow as string) === 'subtle') parsed.shadow = 'light'
    // Backwards compat: old backgroundStyle → new neutralColor + lightBackground
    if ('backgroundStyle' in parsed) {
      const bs = parsed.backgroundStyle as string
      if (!('neutralColor' in parsed)) {
        if (bs === 'base' && 'baseColor' in parsed) {
          const greyMap: Record<string, string> = {
            slate: '#64748b', zinc: '#71717a', stone: '#78716c', gray: '#6b7280', neutral: '#737373'
          }
          parsed.neutralColor = greyMap[parsed.baseColor as string] ?? 'auto'
        } else {
          parsed.neutralColor = 'auto'
        }
      }
      if (!('lightBackground' in parsed)) {
        parsed.lightBackground = bs === 'base' ? 'white' : 'tinted'
      }
      delete parsed.backgroundStyle
      delete parsed.baseColor
    }
    return parsed as unknown as ThemeSettings
  } catch {
    return DEFAULTS
  }
}

function save(s: ThemeSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {}
}

// Inject CSS variables onto :root so every component picks them up automatically
function applyTheme(s: ThemeSettings) {
  const root = document.documentElement.style
  const html = document.documentElement

  // ── Determine dark mode ──────────────────────────────────────────────────
  let isDark: boolean
  if (s.mode === 'dark') {
    isDark = true
  } else if (s.mode === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  } else {
    isDark = false
  }

  // Toggle .dark class for Tailwind dark: utilities
  if (isDark) {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }

  // ── Border radius ────────────────────────────────────────────────────────
  root.setProperty('--card-radius', s.radius)
  root.setProperty('--radius', s.radius)
  const radiusNum = parseInt(s.radius, 10)
  root.setProperty('--radius-md', `${Math.min(radiusNum, 10)}px`)

  // ── UI Size ───────────────────────────────────────────────────────────────
  // Drive via data-ui-size attribute — CSS overrides handle button/input scaling
  if (s.uiSize === 'default') {
    html.removeAttribute('data-ui-size')
  } else {
    html.setAttribute('data-ui-size', s.uiSize)
  }

  // ── Table style ──────────────────────────────────────────────────────────
  if (s.tableStyle === 'full-bleed') {
    html.setAttribute('data-table-style', 'full-bleed')
  } else {
    html.removeAttribute('data-table-style')
  }

  // ── Primary colour ───────────────────────────────────────────────────────
  const fallbackPrimary = '#4982e8'
  const primaryRgb = hexToRgb(s.primaryColor) ?? hexToRgb(fallbackPrimary)!
  const white: RGB = { r: 255, g: 255, b: 255 }
  const nearWhite: RGB = { r: 252, g: 253, b: 255 }

  const primary = rgbToHex(primaryRgb)
  const primaryOpaque     = rgbToHex(mix(primaryRgb, white, 0.88))  // 12% primary — White bg muted
  const primaryOpaqueMid  = rgbToHex(mix(primaryRgb, white, 0.80))  // 20% primary — Light bg muted
  const primaryOpaqueDark = rgbToHex(mix(primaryRgb, white, 0.72))  // 28% primary — Dark bg muted
  const primaryTint = rgbToHex(mix(primaryRgb, nearWhite, 0.98))
  const primaryDarkTint = rgbToHex(mix(primaryRgb, nearWhite, 0.92))
  const primaryDark = rgbToHex(mix(primaryRgb, { r: 10, g: 37, b: 64 }, 0.62))

  const primaryForeground = relativeLuminance(primaryRgb) > 0.45 ? '#0a2540' : '#ffffff'

  // Backline design tokens
  root.setProperty('--backline-color-primary', primary)
  root.setProperty('--backline-color-primary-opaque', primaryOpaque)
  root.setProperty('--backline-color-primary-light', primaryTint)
  root.setProperty('--backline-color-primary-dark', primaryDark)

  // Primary semantic tokens (always apply regardless of mode)
  root.setProperty('--primary', primary)
  root.setProperty('--primary-foreground', primaryForeground)
  root.setProperty('--accent-foreground', isDark ? '#f8fafc' : '#0f172a')
  root.setProperty('--destructive', 'var(--backline-color-crimson)')
  root.setProperty('--destructive-foreground', '#ffffff')
  root.setProperty('--ring', primary)

  // Sidebar primary
  root.setProperty('--sidebar-primary', primary)
  root.setProperty('--sidebar-primary-foreground', primaryForeground)
  // Accent: light tint in light mode, transparent overlay in dark mode
  const primaryDarkAccent = `rgba(${primaryRgb.r},${primaryRgb.g},${primaryRgb.b},0.18)`
  root.setProperty('--sidebar-accent', isDark ? primaryDarkAccent : primaryOpaque)
  root.setProperty('--sidebar-accent-foreground', isDark ? '#f8fafc' : '#0f172a')
  root.setProperty('--accent', isDark ? primaryDarkAccent : primaryOpaque)
  root.setProperty('--sidebar-ring', primary)

  // ── Determine neutral source RGB ─────────────────────────────────────────
  const neutralRgb = s.neutralColor === 'auto'
    ? primaryRgb
    : (hexToRgb(s.neutralColor) ?? primaryRgb)

  // ── Mode-specific tokens ─────────────────────────────────────────────────
  // Shared hue derivation from neutral source
  const [nHue, nSat] = rgbToHsl(neutralRgb.r, neutralRgb.g, neutralRgb.b)
  const capN = (v: number, max: number) => Math.min(v, max)

  // Dark mode derived tokens (always hue-derived from neutral source)
  const darkBg      = hslToHex(nHue, capN(nSat * 0.13, 20), 8)
  const darkCard    = hslToHex(nHue, capN(nSat * 0.10, 16), 11)
  const darkMuted   = hslToHex(nHue, capN(nSat * 0.08, 14), 15)
  const darkMutedFg = hslToHex(nHue, capN(nSat * 0.10, 15), 60)
  const darkBorder  = hslToHex(nHue, capN(nSat * 0.10, 18), 20)
  const darkFg      = '#f8fafc'

  // Light mode derived tokens — saturation scales up for tinted backgrounds
  // so --muted/--secondary/--border harmonise with the primary wash rather than staying grey
  const isTinted     = s.lightBackground === 'tinted'
  const isDarkTinted = s.lightBackground === 'dark-tinted'
  const lsMutedSat      = isDarkTinted ? capN(nSat * 0.28, 34) : isTinted ? capN(nSat * 0.18, 22) : capN(nSat * 0.10, 12)
  const lsMutedDeepSat  = isDarkTinted ? capN(nSat * 0.32, 38) : isTinted ? capN(nSat * 0.20, 26) : capN(nSat * 0.12, 14)
  const lsBorderSat     = isDarkTinted ? capN(nSat * 0.40, 46) : isTinted ? capN(nSat * 0.25, 30) : capN(nSat * 0.15, 18)
  const lightMuted     = hslToHex(nHue, lsMutedSat,     96)
  const lightMutedDeep = hslToHex(nHue, lsMutedDeepSat, 95)
  const lightBorder    = hslToHex(nHue, lsBorderSat, 89)

  if (isDark) {
    root.setProperty('--background', darkMuted)
    root.setProperty('--foreground', darkFg)
    root.setProperty('--card-foreground', darkFg)
    root.setProperty('--muted', darkMuted)
    root.setProperty('--muted-foreground', darkMutedFg)
    root.setProperty('--border', darkBorder)
    root.setProperty('--input', darkBorder)
    root.setProperty('--popover', darkCard)
    root.setProperty('--popover-foreground', darkFg)
    root.setProperty('--secondary', darkMuted)
    root.setProperty('--secondary-foreground', darkFg)
    root.setProperty('--sidebar', darkCard)
    root.setProperty('--sidebar-foreground', darkFg)
    root.setProperty('--sidebar-border', darkBorder)
    root.setProperty('--color-text', darkFg)
    root.setProperty('--color-text-secondary', darkMutedFg)
    root.setProperty('--color-border', darkBorder)
    root.setProperty('--color-background', darkBg)
    root.setProperty('--color-background-alt', darkCard)
  } else {
    // Light background: muted = lightMuted grey; tinted = faint primary wash; dark-tinted = stronger primary wash
    const bgValue = s.lightBackground === 'pure' ? '#ffffff' : s.lightBackground === 'dark-tinted' ? primaryDarkTint : s.lightBackground === 'tinted' ? primaryTint : lightMuted
    root.setProperty('--background', bgValue)
    root.setProperty('--foreground', '#1a1f2e')
    root.setProperty('--card-foreground', '#1a1f2e')
    root.setProperty('--muted', lightMutedDeep)
    root.setProperty('--muted-foreground', '#64748b')
    root.setProperty('--border', lightBorder)
    root.setProperty('--input', lightBorder)
    root.setProperty('--popover', '#ffffff')
    root.setProperty('--popover-foreground', '#1a1f2e')
    root.setProperty('--secondary', lightMuted)
    root.setProperty('--secondary-foreground', '#0f172a')
    root.setProperty('--sidebar', '#ffffff')
    root.setProperty('--sidebar-foreground', '#1a1f2e')
    root.setProperty('--sidebar-border', lightBorder)
    root.setProperty('--color-text', '#1a1f2e')
    root.setProperty('--color-text-secondary', '#64748b')
    root.setProperty('--color-border', lightBorder)
    root.setProperty('--color-background', bgValue)
    root.setProperty('--color-background-alt', primaryOpaque)
  }

  // Chart colors
  const charts = chartPalette(primary)
  charts.forEach((c, i) => root.setProperty(`--chart-${i + 1}`, c))

  // ── Shadow scale ─────────────────────────────────────────────────────────
  const shadowTokens: Record<ShadowIntensity, { sm: string; md: string; lg: string; xl: string }> = {
    none: {
      sm: 'none',
      md: 'none',
      lg: 'none',
      xl: 'none',
    },
    light: {
      sm: '0 1px 2px 0 rgba(0,0,0,0.04), 0 1px 1px -1px rgba(0,0,0,0.02)',
      md: '0 3px 6px -1px rgba(0,0,0,0.05), 0 1px 3px -1px rgba(0,0,0,0.03)',
      lg: '0 6px 12px -2px rgba(0,0,0,0.06), 0 3px 5px -3px rgba(0,0,0,0.03)',
      xl: '0 12px 20px -4px rgba(0,0,0,0.06), 0 5px 8px -5px rgba(0,0,0,0.03)',
    },
    medium: {
      sm: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.05)',
      md: '0 3px 8px -1px rgba(0,0,0,0.10), 0 1px 4px -1px rgba(0,0,0,0.07)',
      lg: '0 8px 16px -3px rgba(0,0,0,0.11), 0 3px 6px -3px rgba(0,0,0,0.07)',
      xl: '0 16px 28px -5px rgba(0,0,0,0.11), 0 6px 10px -6px rgba(0,0,0,0.06)',
    },
  }
  const st = shadowTokens[s.shadow]
  root.setProperty('--shadow-sm', st.sm)
  root.setProperty('--shadow-md', st.md)
  root.setProperty('--shadow-lg', st.lg)
  root.setProperty('--shadow-xl', st.xl)
  root.setProperty('--card-shadow', st.md)

  // ── Card style vars ──────────────────────────────────────────────────────
  const hasShadow = s.shadow !== 'none'
  const shadowMdVal = hasShadow ? st.md : ''

  if (isDark) {
    switch (s.cardStyle) {
      case 'outline':
        root.setProperty('--card-bg', 'transparent')
        root.setProperty('--card', 'transparent')
        root.setProperty('--card-box-shadow', `0 0 0 1px ${darkBorder}`)
        root.setProperty('--tab-active-bg', 'rgba(255,255,255,0.15)')
        break
      case 'single-border':
        root.setProperty('--card-bg', darkCard)
        root.setProperty('--card', darkCard)
        root.setProperty('--card-box-shadow', hasShadow
          ? `0 0 0 1px ${darkBorder}, ${shadowMdVal}`
          : `0 0 0 1px ${darkBorder}`)
        root.setProperty('--tab-active-bg', darkCard)
        break
      case 'inset-highlight':
        root.setProperty('--card-bg', darkCard)
        root.setProperty('--card', darkCard)
        root.setProperty('--card-box-shadow', hasShadow
          ? `0 0 0 1px rgba(255,255,255,0.10), inset 0 0 0 2px rgba(0,0,0,0.35), ${shadowMdVal}`
          : `0 0 0 1px rgba(255,255,255,0.10), inset 0 0 0 2px rgba(0,0,0,0.35)`)
        root.setProperty('--tab-active-bg', darkCard)
        break
    }
  } else {
    const borderToken = 'var(--border)'
    const isPureBg = s.lightBackground === 'pure'
    const cardBgMap: Record<CardStyle, string> = {
      'outline':         'transparent',
      'single-border':   '#ffffff',
      'inset-highlight': '#fcfdff',
    }
    const cardBg = cardBgMap[s.cardStyle]
    root.setProperty('--card-bg', cardBg)
    root.setProperty('--card', cardBg)

    switch (s.cardStyle) {
      case 'outline':
        // Outline always keeps its border — without it the card is invisible
        root.setProperty('--card-box-shadow', `0 0 0 1px ${borderToken}`)
        root.setProperty('--tab-active-bg', 'rgba(0,0,0,0.08)')
        break
      case 'single-border':
        // Hairline only on White background; elsewhere just shadow
        root.setProperty('--card-box-shadow', isPureBg
          ? (hasShadow ? `0 0 0 1px ${borderToken}, ${shadowMdVal}` : `0 0 0 1px ${borderToken}`)
          : (hasShadow ? shadowMdVal : 'none'))
        root.setProperty('--tab-active-bg', '#ffffff')
        break
      case 'inset-highlight':
        // Hairline + inset only on White background; elsewhere just shadow
        root.setProperty('--card-box-shadow', isPureBg
          ? (hasShadow
              ? `0 0 0 1px rgba(0,0,0,0.05), inset 0 0 0 2px #ffffff, ${shadowMdVal}`
              : `0 0 0 1px rgba(0,0,0,0.05), inset 0 0 0 2px #ffffff`)
          : (hasShadow ? shadowMdVal : 'none'))
        root.setProperty('--tab-active-bg', '#fcfdff')
        break
    }
  }
}

interface ThemeContextValue {
  settings: ThemeSettings
  update: (patch: Partial<ThemeSettings>) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  settings: DEFAULTS,
  update: () => {},
})

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ThemeSettings>(load)

  useEffect(() => {
    applyTheme(settings)
    save(settings)
  }, [settings])

  // Listen for system prefers-color-scheme changes when mode is 'system'
  useEffect(() => {
    if (settings.mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme(settings)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings])

  const update = (patch: Partial<ThemeSettings>) =>
    setSettings(prev => ({ ...prev, ...patch }))

  return (
    <ThemeContext.Provider value={{ settings, update }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
