import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SortButtonProps {
  label: string
  direction?: 'asc' | 'desc' | null
  onClick: () => void
  className?: string
}

export function SortButton({ label, direction, onClick, className }: SortButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn('flex items-center gap-1.5 font-medium', className)}
    >
      {label}
      {direction === 'asc' ? (
        <ArrowUp className="h-3 w-3 opacity-70" />
      ) : direction === 'desc' ? (
        <ArrowDown className="h-3 w-3 opacity-70" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      )}
    </button>
  )
}
