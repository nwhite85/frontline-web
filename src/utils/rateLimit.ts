interface RateLimitEntry {
  count: number
  resetTime: number
}

const ipMap = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of ipMap) {
    if (now > entry.resetTime) {
      ipMap.delete(key)
    }
  }
}, 60_000)

export function rateLimit(
  ip: string,
  { limit = 60, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = ipMap.get(ip)

  if (!entry || now > entry.resetTime) {
    ipMap.set(ip, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  entry.count++
  if (entry.count > limit) {
    return { success: false, remaining: 0 }
  }

  return { success: true, remaining: limit - entry.count }
}
