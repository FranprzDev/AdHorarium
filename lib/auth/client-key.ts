const UNKNOWN_CLIENT = "unknown"

/**
 * Best-effort client identifier for rate limiting: the first `x-forwarded-for` hop (set by Vercel),
 * or a shared bucket when the header is missing (per-email limits still apply in that case).
 */
export function getClientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")
  const first = forwarded?.split(",")[0]?.trim()
  return first || headers.get("x-real-ip")?.trim() || UNKNOWN_CLIENT
}
