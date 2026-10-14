import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import { isUserRole } from "@/lib/auth/roles"
import { readRequiredEnv } from "@/lib/env"
import { EnvVar, UserRole } from "@/types/enums"

export const SIGN_IN_PAGE = "/"

export function createBaseAuthConfig(): NextAuthConfig {
  return {
    providers: [
      Google({
        clientId: readRequiredEnv(EnvVar.AuthGoogleId),
        clientSecret: readRequiredEnv(EnvVar.AuthGoogleSecret),
      }),
    ],
    session: { strategy: "jwt" },
    pages: { signIn: SIGN_IN_PAGE },
    callbacks: {
      session({ session, token }) {
        if (token.sub) session.user.id = token.sub
        session.user.role = isUserRole(token.role) ? token.role : UserRole.Student
        return session
      },
    },
  }
}
