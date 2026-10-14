import { eq } from "drizzle-orm"
import { auth } from "@/auth"
import { getDb } from "@/db/client"
import { users } from "@/db/schema"
import { isAdmin } from "@/lib/auth/roles"
import type { UserRole } from "@/types/enums"

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthorizationError"
  }
}

export async function requireUserId(): Promise<string> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) throw new AuthorizationError("Necesitás iniciar sesión")
  return userId
}

/** Role stored in the database for a user, which is the source of truth (the JWT role is only refreshed on sign in). */
export async function getStoredUserRole(userId: string): Promise<UserRole | null> {
  const [row] = await getDb().select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1)
  return row?.role ?? null
}

export async function requireAdminUserId(): Promise<string> {
  const userId = await requireUserId()
  if (!isAdmin(await getStoredUserRole(userId))) throw new AuthorizationError("Necesitás permisos de administrador")
  return userId
}
