import { DAY_MS, MINUTE_MS, type RateLimitRule } from "@/lib/rate-limit"

/** Limits applied per student to the schedule assistant. */
export const ASSISTANT_RATE_LIMITS: ReadonlyArray<RateLimitRule> = [
  { limit: 6, windowMs: MINUTE_MS },
  { limit: 60, windowMs: DAY_MS },
]
