import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import type { NextFetchEvent, NextRequest } from "next/server"
import { createBaseAuthConfig } from "@/auth.config"
import { withoutBackgroundSessionRefresh } from "@/lib/auth/background-request"
import { AccessDecision, decideAccess, isUserRole } from "@/lib/auth/roles"

const FORBIDDEN_REDIRECT = "/acceso-denegado"

const { auth } = NextAuth(() => {
  const base = createBaseAuthConfig()
  return {
    ...base,
    callbacks: {
      ...base.callbacks,
      authorized({ auth: session, request }) {
        const tokenRole = session?.user?.role
        const role = session?.user && isUserRole(tokenRole) ? tokenRole : null
        const decision = decideAccess(request.nextUrl.pathname, role)
        if (decision === AccessDecision.Forbidden) return NextResponse.redirect(new URL(FORBIDDEN_REDIRECT, request.nextUrl))
        return decision === AccessDecision.Allow
      },
    },
  }
})

type AuthMiddleware = (request: NextRequest, event: NextFetchEvent) => Promise<Response>

/** `auth(request, event)` is the inline middleware form Auth.js runs at runtime; its overloads do not declare it. */
const authMiddleware = auth as unknown as AuthMiddleware

export default async function middleware(request: NextRequest, event: NextFetchEvent): Promise<Response> {
  const response = await authMiddleware(request, event)
  return withoutBackgroundSessionRefresh(request.headers, response)
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
