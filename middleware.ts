import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import { createBaseAuthConfig, SIGN_IN_PAGE } from "@/auth.config"
import { AccessDecision, decideAccess, isUserRole } from "@/lib/auth/roles"

const { auth } = NextAuth(() => createBaseAuthConfig())

export default auth((request) => {
  const tokenRole = request.auth?.user?.role
  const role = request.auth?.user && isUserRole(tokenRole) ? tokenRole : null
  const decision = decideAccess(request.nextUrl.pathname, role)
  if (decision === AccessDecision.RequireSignIn) return NextResponse.redirect(new URL(SIGN_IN_PAGE, request.nextUrl))
  if (decision === AccessDecision.Forbidden) return NextResponse.redirect(new URL("/dashboard", request.nextUrl))
  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
