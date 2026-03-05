'use client'

import { Check, Moon, Plus, Sun, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useTheme } from '@/contexts/ThemeContext'
import type { CardStyle, RadiusSize, ShadowIntensity, UISize, LightBackground, TableStyle } from '@/contexts/ThemeContext'

const CARD_STYLES = [
  { id: 'single-border' as CardStyle,   label: 'Single Border',   desc: 'Standard card with border' },
  { id: 'inset-highlight' as CardStyle, label: 'Inset Highlight', desc: 'Backline signature style' },
  { id: 'outline' as CardStyle,         label: 'Outline',         desc: 'Bold border, no fill' },
]

const RADII: { value: RadiusSize; label: string }[] = [
  { value: '0px',  label: '0' },
  { value: '6px',  label: '6' },
  { value: '12px', label: '12' },
  { value: '16px', label: '16' },
]

const SHADOWS: { value: ShadowIntensity; label: string }[] = [
  { value: 'none',   label: 'None' },
  { value: 'light',  label: 'Light' },
  { value: 'medium', label: 'Medium' },
]

const UI_SIZES: { value: UISize; label: string }[] = [
  { value: 'sm',      label: 'Small' },
  { value: 'default', label: 'Default' },
  { value: 'lg',      label: 'Large' },
]

const COLORS = [
  { value: '#4982e8', label: 'Blue' },
  { value: '#635BFF', label: 'Violet' },
  { value: '#15BE53', label: 'Emerald' },
  { value: '#FF4F40', label: 'Crimson' },
  { value: '#FFAD00', label: 'Amber' },
  { value: '#0a2540', label: 'Midnight' },
]

const NEUTRAL_PRESETS = [
  { value: '#64748b', label: 'Slate' },
  { value: '#71717a', label: 'Zinc' },
  { value: '#78716c', label: 'Stone' },
  { value: '#6b7280', label: 'Gray' },
  { value: '#737373', label: 'Neutral' },
]

const DEFAULTS = {
  cardStyle: 'inset-highlight' as CardStyle,
  radius: '12px' as RadiusSize,
  shadow: 'light' as ShadowIntensity,
  primaryColor: '#4982e8',
  uiSize: 'default' as UISize,
  mode: 'light' as const,
  neutralColor: 'auto',
  lightBackground: 'tinted' as LightBackground,
}

interface ThemeSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ThemeSettingsSheet({ open, onOpenChange }: ThemeSettingsSheetProps) {
  const { settings, update } = useTheme()

  if (!open) return null

  return (
    <div
      className="fixed z-[200] w-80 max-h-[calc(100vh-4rem)] overflow-y-auto rounded-xl border border-border bg-background shadow-xl flex flex-col"
      style={{ bottom: '1rem', right: '1rem' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <p className="text-sm font-semibold">Theme</p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => update({ mode: settings.mode === 'dark' ? 'light' : 'dark' })}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={settings.mode === 'dark' ? 'Switch to light' : 'Switch to dark'}
          >
            {settings.mode === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-5 p-4">

        {/* UI Size */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">UI Size</p>
          <div className="flex gap-2">
            {UI_SIZES.map(s => (
              <button
                key={s.value}
                onClick={() => update({ uiSize: s.value })}
                className={cn(
                  'flex-1 py-1.5 rounded-md border text-xs font-medium transition-colors',
                  settings.uiSize === s.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Layout */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Table Layout</p>
          <div className="flex gap-2">
            {(['contained', 'full-bleed'] as TableStyle[]).map(v => (
              <button
                key={v}
                onClick={() => update({ tableStyle: v })}
                className={cn(
                  'flex-1 py-1.5 rounded-md border text-xs font-medium transition-colors capitalize',
                  settings.tableStyle === v
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                )}
              >
                {v === 'contained' ? 'Contained' : 'Full Bleed'}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Card Style */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Card Style</p>
          {CARD_STYLES.map(s => (
            <button
              key={s.id}
              onClick={() => update({ cardStyle: s.id })}
              className={cn(
                'flex items-center gap-3 w-full rounded-lg border px-3 py-2.5 text-left transition-colors',
                settings.cardStyle === s.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-muted/30 hover:bg-muted'
              )}
            >
              {/* Style-specific preview swatch */}
              {s.id === 'inset-highlight' && (
                <div className="w-9 h-6 rounded shrink-0 bg-white" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.07), inset 0 0 0 2px #ffffff, 0 2px 4px rgba(0,0,0,0.06)' }} />
              )}
              {s.id === 'single-border' && (
                <div className="w-9 h-6 rounded shrink-0 bg-white" style={{ boxShadow: '0 0 0 1px #d1d5db, 0 2px 4px rgba(0,0,0,0.06)' }} />
              )}
              {s.id === 'outline' && (
                <div className="w-9 h-6 rounded shrink-0 bg-transparent" style={{ boxShadow: '0 0 0 1.5px #d1d5db' }} />
              )}
              <div>
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
              {settings.cardStyle === s.id && <Check className="ml-auto size-4 text-primary shrink-0" />}
            </button>
          ))}
        </div>

        <Separator />

        {/* Border Radius */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Border Radius</p>
          <div className="flex gap-2">
            {RADII.map(r => (
              <button
                key={r.value}
                onClick={() => update({ radius: r.value })}
                className={cn(
                  'flex-1 py-1.5 rounded-md border text-xs font-medium transition-colors',
                  settings.radius === r.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                )}
              >
                {r.label}px
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Shadow */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Shadow</p>
          <div className="flex gap-2">
            {SHADOWS.map(s => (
              <button
                key={s.value}
                onClick={() => update({ shadow: s.value })}
                className={cn(
                  'flex-1 py-1.5 rounded-md border text-xs font-medium transition-colors',
                  settings.shadow === s.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Primary Colour */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Primary Colour</p>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => update({ primaryColor: c.value })}
                title={c.label}
                className="size-7 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: c.value,
                  borderColor: settings.primaryColor === c.value ? c.value : 'transparent',
                  outlineOffset: '2px',
                  outline: settings.primaryColor === c.value ? `2px solid ${c.value}` : 'none',
                }}
              />
            ))}
            <label className="size-7 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted relative overflow-hidden">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={e => update({ primaryColor: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Plus className="size-3 text-muted-foreground" />
            </label>
          </div>
        </div>

        <Separator />

        {/* Neutral Colour */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Neutral Colour</p>
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => update({ neutralColor: 'auto' })}
              title="Auto — linked to primary"
              className={cn(
                'size-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all',
                settings.neutralColor === 'auto'
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-border text-muted-foreground hover:bg-muted'
              )}
              style={settings.neutralColor === 'auto' ? {
                outlineOffset: '2px',
                outline: `2px solid ${settings.primaryColor}`,
              } : undefined}
            >
              A
            </button>
            {NEUTRAL_PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => update({ neutralColor: p.value })}
                title={p.label}
                className="size-7 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: p.value,
                  borderColor: settings.neutralColor === p.value ? p.value : 'transparent',
                  outlineOffset: '2px',
                  outline: settings.neutralColor === p.value ? `2px solid ${p.value}` : 'none',
                }}
              />
            ))}
            <label className="size-7 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted relative overflow-hidden">
              <input
                type="color"
                value={settings.neutralColor === 'auto' ? '#808080' : settings.neutralColor}
                onChange={e => update({ neutralColor: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Plus className="size-3 text-muted-foreground" />
            </label>
          </div>
        </div>

        <Separator />

        {/* Light Mode Background */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Light Mode Background</p>
          <div className="flex gap-2">
            {([
              { value: 'pure'        as LightBackground, label: 'White' },
              { value: 'white'       as LightBackground, label: 'Muted' },
              { value: 'tinted'      as LightBackground, label: 'Light' },
              { value: 'dark-tinted' as LightBackground, label: 'Dark' },
            ]).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => update({ lightBackground: value })}
                className={cn(
                  'flex-1 py-1.5 rounded-md border text-xs font-medium transition-colors',
                  settings.lightBackground === value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <Button variant="outline" className="w-full" onClick={() => update(DEFAULTS)}>
          Reset to defaults
        </Button>
      </div>
    </div>
  )
}
