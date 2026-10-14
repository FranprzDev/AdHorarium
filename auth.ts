import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { eq } from "drizzle-orm"
import NextAuth from "next-auth"
import { createBaseAuthConfig } from "@/auth.config"
import { getDb } from "@/db/client"
import { accounts, sessions, users, verificationTokens } from "@/db/schema"
import { isUserRole, resolveRoleOnSignIn } from "@/lib/auth/roles"
import { getAdminEmails } from "@/lib/env"
import { UserRole } from "@/types/enums"

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
    adapter: DrizzleAdapter(getDb(), {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
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
