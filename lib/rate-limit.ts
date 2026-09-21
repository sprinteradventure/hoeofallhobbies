// ============================================================================
// In-memory sliding-window rate limiter (R6).
//
// Serverless-basic: a module-level Map of key -> timestamps. Works per
// warm instance — enough to stop casual abuse scripts; a distributed
// store (Upstash etc.) would be needed for strict global limits.
// Stale keys are swept periodically so the Map cannot grow unbounded.
// ============================================================================

const buckets = new Map<string, number[]>()

let lastSweep = 0
const SWEEP_INTERVAL_MS = 60_000

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return
  lastSweep = now
  for (const [key, hits] of buckets) {
    // Keep only recent-ish entries; fully idle keys drop out after 1 hour.
    const recent = hits.filter((t) => t > now - 60 * 60 * 1000)
    if (recent.length === 0) buckets.delete(key)
    else buckets.set(key, recent)
  }
}

/**
 * Returns true when the call is ALLOWED, false when the key is over the
 * limit. `limit` hits are allowed per `windowMs` sliding window.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  sweep(now)

  const windowStart = now - windowMs
  const hits = (buckets.get(key) ?? []).filter((t) => t > windowStart)

  if (hits.length >= limit) {
    buckets.set(key, hits)
    return false
  }

  hits.push(now)
  buckets.set(key, hits)
  return true
}
