/** Shared timetable links carry their access token in the path; analytics only needs the route. */
const SHARED_SCHEDULE_PATH = /^\/horarios\/compartido\/[^/]+/

export const SHARED_SCHEDULE_ROUTE = "/horarios/compartido/[shareId]"

/**
 * Reduces a page URL to what aggregate analytics needs: origin and path, with secrets removed. The query string and
 * hash are dropped because they can hold tokens or emails (sign-in callbacks, password reset links).
 */
export function redactAnalyticsUrl(url: string): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return url
  }
  const path = parsed.pathname.replace(SHARED_SCHEDULE_PATH, SHARED_SCHEDULE_ROUTE)
  return `${parsed.origin}${path}`
}

/** `beforeSend` hook for Vercel Web Analytics and Speed Insights events. */
export function redactAnalyticsEvent<T extends { url: string }>(event: T): T {
  return { ...event, url: redactAnalyticsUrl(event.url) }
}
