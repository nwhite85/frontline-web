'use client'

export function ScrollButton({
  target,
  className,
  children,
}: {
  target: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })}
      className={className}
    >
      {children}
    </button>
  )
}
