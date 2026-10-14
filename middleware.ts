import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import { createBaseAuthConfig } from "@/auth.config"
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

export default auth

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
