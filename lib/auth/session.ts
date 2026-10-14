import { eq } from "drizzle-orm"
import { auth } from "@/auth"
import { getDb } from "@/db/client"
import { users } from "@/db/schema"
import { isAdmin } from "@/lib/auth/roles"

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

export async function requireAdminUserId(): Promise<string> {
  const userId = await requireUserId()
  const [row] = await getDb().select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1)
  if (!isAdmin(row?.role)) throw new AuthorizationError("Necesitás permisos de administrador")
  return userId
}
