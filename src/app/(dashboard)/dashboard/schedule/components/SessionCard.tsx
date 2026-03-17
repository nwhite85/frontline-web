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

// text-blue-900 dark:text-blue-100 text-blue-700 dark:text-blue-300 bg-blue-500
// text-green-900 dark:text-green-100 text-green-700 dark:text-green-300 bg-green-500
// text-orange-900 dark:text-orange-100 text-orange-700 dark:text-orange-300 bg-orange-500
// text-purple-900 dark:text-purple-100 text-purple-700 dark:text-purple-300 bg-purple-500

const typeConfig = {
  appointment: { bar: 'bg-blue-500',   bgVar: 'var(--session-appointment-bg)', titleVar: 'var(--session-appointment-title)', subVar: 'var(--session-appointment-sub)' },
  class:       { bar: 'bg-green-500',  bgVar: 'var(--session-class-bg)',        titleVar: 'var(--session-class-title)',        subVar: 'var(--session-class-sub)' },
  event:       { bar: 'bg-orange-500', bgVar: 'var(--session-event-bg)',         titleVar: 'var(--session-event-title)',        subVar: 'var(--session-event-sub)' },
  challenge:   { bar: 'bg-purple-500', bgVar: 'var(--session-challenge-bg)',     titleVar: 'var(--session-challenge-title)',    subVar: 'var(--session-challenge-sub)' },
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
        isTiny ? 'p-0.5' : 'p-1',
        className,
      )}
      style={{ backgroundColor: config.bgVar, ...style }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Content */}
      {isTiny ? (
        // Tiny: one line only — title + time inline, no subtitle
        <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
          <span className="font-medium truncate leading-none" style={{ color: config.titleVar }}>{title}</span>
          <span className="text-[0.6rem] shrink-0 leading-none opacity-80" style={{ color: config.subVar }}>{timeDisplay}</span>
        </div>
      ) : (
        // Normal + compact: title row + optional time row
        <div className="flex items-start justify-between min-w-0 flex-1 gap-1 overflow-hidden">
          <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
            <div className="font-medium truncate leading-tight" style={{ color: config.titleVar }}>{title}</div>
            {!isCompact && (
              <div className="truncate leading-tight text-[0.65rem]" style={{ color: config.subVar }}>{timeDisplay}</div>
            )}
          </div>
          {!isTiny && subtitle && (
            <span className="text-[0.65rem] font-semibold shrink-0 leading-tight mt-0.5" style={{ color: config.subVar }}>{subtitle}</span>
          )}
        </div>
      )}
    </div>
  )
}
