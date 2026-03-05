export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (date.getTime() === today.getTime()) return 'Today'
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const s = h >= 12 ? 'pm' : 'am'
  const hr = h % 12 || 12
  return m === 0 ? `${hr}${s}` : `${hr}:${m.toString().padStart(2, '0')}${s}`
}
