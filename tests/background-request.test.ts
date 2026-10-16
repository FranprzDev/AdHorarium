import { describe, expect, it } from "vitest"
import { BackgroundRequestHeader, isBackgroundRequest, withoutBackgroundSessionRefresh } from "@/lib/auth/background-request"

const SESSION_COOKIE = "authjs.session-token=abc; Path=/; HttpOnly"

function responseWithCookie(): Response {
  const response = new Response(null, { status: 200 })
  response.headers.append("set-cookie", SESSION_COOKIE)
  return response
}

describe("isBackgroundRequest", () => {
  it.each(Object.values(BackgroundRequestHeader))("treats a request with %s as a background fetch", (header) => {
    expect(isBackgroundRequest(new Headers({ [header]: "1" }))).toBe(true)
  })

  it("treats a document navigation as a foreground request", () => {
    expect(isBackgroundRequest(new Headers({ accept: "text/html", "sec-fetch-dest": "document" }))).toBe(false)
  })
})

describe("withoutBackgroundSessionRefresh", () => {
  it("drops the refreshed session cookie from a server action response", () => {
    const response = withoutBackgroundSessionRefresh(new Headers({ [BackgroundRequestHeader.ServerAction]: "id" }), responseWithCookie())
    expect(response.headers.get("set-cookie")).toBeNull()
  })

  it("keeps the refreshed session cookie on a document navigation", () => {
    const response = withoutBackgroundSessionRefresh(new Headers({ accept: "text/html" }), responseWithCookie())
    expect(response.headers.get("set-cookie")).toBe(SESSION_COOKIE)
  })

  it("keeps the redirect of an access decision", () => {
    const redirect = new Response(null, { status: 307, headers: { location: "https://adhorarium.vercel.app/ingresar" } })
    const response = withoutBackgroundSessionRefresh(new Headers({ [BackgroundRequestHeader.ReactServerComponent]: "1" }), redirect)
    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe("https://adhorarium.vercel.app/ingresar")
  })
})
