import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { eq } from "drizzle-orm"
import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { createBaseAuthConfig } from "@/auth.config"
import { getDb } from "@/db/client"
import { findCredentialUserByEmail } from "@/db/queries/auth"
import { markEmailVerified } from "@/db/queries/tokens"
import { accounts, sessions, users, verificationTokens } from "@/db/schema"
import { getClientKey } from "@/lib/auth/client-key"
import { authorizeCredentials, SIGN_IN_CLIENT_RATE_LIMITS, SIGN_IN_EMAIL_RATE_LIMITS } from "@/lib/auth/credentials"
import { isUserRole, resolveRoleOnSignIn } from "@/lib/auth/roles"
import { getAdminEmails } from "@/lib/env"
import { SlidingWindowRateLimiter } from "@/lib/rate-limit"
import { AuthProvider, CredentialsErrorCode, UserRole } from "@/types/enums"

/** Sign in failure surfaced to the client as `code`; the message never says which part was wrong. */
class CredentialsFailure extends CredentialsSignin {
  constructor(code: CredentialsErrorCode) {
    super()
    this.code = code
  }
}

const emailLimiter = new SlidingWindowRateLimiter(SIGN_IN_EMAIL_RATE_LIMITS)
const clientLimiter = new SlidingWindowRateLimiter(SIGN_IN_CLIENT_RATE_LIMITS)

async function syncRoleOnSignIn(userId: string, email: string | null | undefined): Promise<UserRole> {
  const db = getDb()
  const [row] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1)
  const currentRole = row?.role ?? UserRole.Student
  const role = resolveRoleOnSignIn(email, getAdminEmails(), currentRole)
  if (role !== currentRole) await db.update(users).set({ role }).where(eq(users.id, userId))
  return role
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const base = createBaseAuthConfig()
  return {
    ...base,
    providers: [
      ...base.providers,
      Credentials({
        id: AuthProvider.Credentials,
        credentials: { email: {}, password: {} },
        async authorize(credentials, request) {
          const result = await authorizeCredentials(credentials, getClientKey(request.headers), {
            findUserByEmail: (email) => findCredentialUserByEmail(getDb(), email),
            emailLimiter,
            clientLimiter,
          })
          if (!result.ok) throw new CredentialsFailure(result.code)
          return result.user
        },
      }),
    ],
    adapter: DrizzleAdapter(getDb(), {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    events: {
      async linkAccount({ user, account }) {
        if (account.provider === AuthProvider.Google && user.id) await markEmailVerified(getDb(), user.id)
      },
    },
    callbacks: {
      ...base.callbacks,
      async jwt({ token, user }) {
        if (user?.id) {
          token.sub = user.id
          token.role = await syncRoleOnSignIn(user.id, user.email)
        }
        if (!isUserRole(token.role)) token.role = UserRole.Student
        return token
      },
    },
  }
})
