"use client"

import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { redactAnalyticsEvent } from "@/lib/observability/redact-url"

/**
 * Vercel Web Analytics (page views) and Speed Insights (real-user performance), both free on the Hobby plan and
 * cookieless. Every event goes through `redactAnalyticsEvent` so share tokens and query strings never leave the browser.
 */
export function VercelObservability() {
  return (
    <>
      <Analytics beforeSend={redactAnalyticsEvent} />
      <SpeedInsights beforeSend={redactAnalyticsEvent} />
    </>
  )
}
