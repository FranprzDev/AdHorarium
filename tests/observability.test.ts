import { describe, expect, it } from "vitest"
import { redactAnalyticsEvent, redactAnalyticsUrl, SHARED_SCHEDULE_ROUTE } from "@/lib/observability/redact-url"
import { buildRequestErrorLog } from "@/lib/observability/request-error-log"
import { LogEvent, LogLevel } from "@/types/enums"

const ORIGIN = "https://adhorarium.vercel.app"

describe("redactAnalyticsUrl", () => {
  it("replaces the share token of a shared timetable with the route", () => {
    expect(redactAnalyticsUrl(`${ORIGIN}/horarios/compartido/r5X_6IAynvGFD57bDKEpFg`)).toBe(`${ORIGIN}${SHARED_SCHEDULE_ROUTE}`)
  })

  it("drops the query string and the hash", () => {
    expect(redactAnalyticsUrl(`${ORIGIN}/ingresar?callbackUrl=%2Fadmin&email=a%40b.com#top`)).toBe(`${ORIGIN}/ingresar`)
  })

  it("keeps ordinary paths and leaves unparsable input as is", () => {
    expect(redactAnalyticsUrl(`${ORIGIN}/dashboard/horarios`)).toBe(`${ORIGIN}/dashboard/horarios`)
    expect(redactAnalyticsUrl("not a url")).toBe("not a url")
  })

  it("keeps the other event fields", () => {
    expect(redactAnalyticsEvent({ type: "vital", url: `${ORIGIN}/registro?x=1`, route: "/registro" })).toEqual({
      type: "vital",
      url: `${ORIGIN}/registro`,
      route: "/registro",
    })
  })
})

describe("buildRequestErrorLog", () => {
  const request = { path: "/dashboard/horarios?share=secret", method: "GET" }
  const context = { routerKind: "App Router", routePath: "/dashboard/horarios", routeType: "render", renderSource: "server-rendering" }

  it("keeps the digest, the route and the error without the query string", () => {
    const error = Object.assign(new Error("boom"), { digest: "123456789" })
    const entry = buildRequestErrorLog(error, request, context)
    expect(entry).toMatchObject({
      level: LogLevel.Error,
      event: LogEvent.RequestError,
      digest: "123456789",
      name: "Error",
      message: "boom",
      method: "GET",
      path: "/dashboard/horarios",
      routePath: "/dashboard/horarios",
      routeType: "render",
      renderSource: "server-rendering",
    })
    expect(entry.stack).toContain("boom")
  })

  it("handles thrown values that are not errors", () => {
    const entry = buildRequestErrorLog("plain string", request, { ...context, renderSource: undefined })
    expect(entry).toMatchObject({ digest: null, name: "UnknownError", message: "plain string", stack: null, renderSource: null })
  })
})
