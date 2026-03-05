// @ts-nocheck
'use client'

import { cn } from '@/lib/utils'

export type SessionType = 'appointment' | 'class' | 'event' | 'challenge'

interface SessionCardProps {
  type: SessionType
  title: string
  timeDisplay: string
  subtitle?: string
  durationMinutes?: number
  onClick?: () => void
  onDoubleClick?: () => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: () => void
  style?: React.CSSProperties
  className?: string
}

// Tailwind safelist — ensure these dynamic classes are compiled:
// bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 text-blue-900 dark:text-blue-100 text-blue-700 dark:text-blue-300 bg-blue-500
// bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50 text-green-900 dark:text-green-100 text-green-700 dark:text-green-300 bg-green-500
// bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-950/50 text-orange-900 dark:text-orange-100 text-orange-700 dark:text-orange-300 bg-orange-500
// bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/50 text-purple-900 dark:text-purple-100 text-purple-700 dark:text-purple-300 bg-purple-500

const typeConfig = {
  appointment: {
    bar: 'bg-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    hoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-950/50',
    titleColor: 'text-blue-900 dark:text-blue-100',
    subtitleColor: 'text-blue-700 dark:text-blue-300',
  },
  class: {
    bar: 'bg-green-500',
    bg: 'bg-green-50 dark:bg-green-950/30',
    hoverBg: 'hover:bg-green-100 dark:hover:bg-green-950/50',
    titleColor: 'text-green-900 dark:text-green-100',
    subtitleColor: 'text-green-700 dark:text-green-300',
  },
  event: {
    bar: 'bg-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    hoverBg: 'hover:bg-orange-100 dark:hover:bg-orange-950/50',
    titleColor: 'text-orange-900 dark:text-orange-100',
    subtitleColor: 'text-orange-700 dark:text-orange-300',
  },
  challenge: {
    bar: 'bg-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    hoverBg: 'hover:bg-purple-100 dark:hover:bg-purple-950/50',
    titleColor: 'text-purple-900 dark:text-purple-100',
    subtitleColor: 'text-purple-700 dark:text-purple-300',
  },
}

export function SessionCard({
  type,
  title,
  timeDisplay,
  subtitle,
  durationMinutes = 60,
  onClick,
  onDoubleClick,
  draggable,
  onDragStart,
  onDragEnd,
  style,
  className,
}: SessionCardProps) {
  const config = typeConfig[type]

  // Progressive disclosure rules (Apple Calendar style)
  // < 30 min (~30px): title only, single line — no time, no subtitle
  // 30–44 min (~30–45px): title + subtitle only — no time below
  // ≥ 45 min: full card with title, time, and subtitle
  const isCompact = durationMinutes < 45
  const isTiny = durationMinutes < 30

  return (
    <div
      className={cn(
        'rounded-sm overflow-hidden cursor-pointer transition-colors text-xs flex',
        config.bg,
        config.hoverBg,
        isTiny ? 'p-0.5' : 'p-1',
        className,
      )}
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Content */}
      {isTiny ? (
        // Tiny: one line only — title + time inline, no subtitle
        <div className={cn('flex items-center gap-1 min-w-0 flex-1 overflow-hidden')}>
          <span className={cn('font-medium truncate leading-none', config.titleColor)}>{title}</span>
          <span className={cn('text-[0.6rem] shrink-0 leading-none opacity-80', config.subtitleColor)}>{timeDisplay}</span>
        </div>
      ) : (
        // Normal + compact: title row + optional time row
        <div className="flex items-start justify-between min-w-0 flex-1 gap-1 overflow-hidden">
          <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
            <div className={cn('font-medium truncate leading-tight', config.titleColor)}>{title}</div>
            {!isCompact && (
              <div className={cn('truncate leading-tight text-[0.65rem]', config.subtitleColor)}>{timeDisplay}</div>
            )}
          </div>
          {!isTiny && subtitle && (
            <span className={cn('text-[0.65rem] font-semibold shrink-0 leading-tight mt-0.5', config.subtitleColor)}>{subtitle}</span>
          )}
        </div>
      )}
    </div>
  )
}
