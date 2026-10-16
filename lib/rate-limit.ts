export type RateLimitRule = {
  /** Requests allowed inside the window. */
  limit: number
  windowMs: number
}

export type RateLimitDecision = {
  allowed: boolean
  /** Seconds until the next request would be allowed (0 when allowed). */
  retryAfterSeconds: number
}

/**
 * In-memory sliding window limiter keyed by user id.
 *
 * State lives in the server instance, so on serverless it is a best-effort guard per instance
 * (enough to stop accidental loops and casual abuse), not a global quota.
 */
export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>()

  constructor(
    private readonly rules: ReadonlyArray<RateLimitRule>,
    private readonly now: () => number = Date.now,
  ) {}

  /** Records a request for `key` when every rule allows it. Rejected requests are not counted. */
  consume(key: string): RateLimitDecision {
    const now = this.now()
    const longestWindow = Math.max(...this.rules.map((rule) => rule.windowMs))
    const recent = (this.hits.get(key) ?? []).filter((timestamp) => now - timestamp < longestWindow)

    let retryAfterMs = 0
    for (const rule of this.rules) {
      const inWindow = recent.filter((timestamp) => now - timestamp < rule.windowMs)
      if (inWindow.length >= rule.limit) {
        const oldestRelevant = inWindow[inWindow.length - rule.limit]
        retryAfterMs = Math.max(retryAfterMs, oldestRelevant + rule.windowMs - now)
      }
    }

    if (retryAfterMs > 0) {
      this.hits.set(key, recent)
      return { allowed: false, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) }
    }
    recent.push(now)
    this.hits.set(key, recent)
    return { allowed: true, retryAfterSeconds: 0 }
  }
}

const MINUTE_MS = 60_000
const DAY_MS = 24 * 60 * MINUTE_MS

/** Limits applied per student to the schedule assistant. */
export const ASSISTANT_RATE_LIMITS: ReadonlyArray<RateLimitRule> = [
  { limit: 6, windowMs: MINUTE_MS },
  { limit: 60, windowMs: DAY_MS },
]
