import { eq, sql } from "drizzle-orm"
import type { AppDatabase } from "@/db/client"
import { users } from "@/db/schema"
import { UserRole } from "@/types/enums"

/** The only shape that carries a password hash; it must never leave the server auth code. */
export type CredentialUserRecord = {
  id: string
  email: string
  name: string | null
  image: string | null
  passwordHash: string | null
}

export type NewCredentialStudent = {
  name: string
  email: string
  passwordHash: string
}

export async function findCredentialUserByEmail(db: AppDatabase, email: string): Promise<CredentialUserRecord | null> {
  const [row] = await db
    .select({ id: users.id, email: users.email, name: users.name, image: users.image, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(sql`lower(${users.email})`, email))
    .limit(1)
  return row ?? null
}

/** Creates a student account. Returns false when the email is already taken (including a race with another request). */
export async function createCredentialStudent(db: AppDatabase, input: NewCredentialStudent): Promise<boolean> {
  const rows = await db
    .insert(users)
    .values({ name: input.name, email: input.email, passwordHash: input.passwordHash, role: UserRole.Student })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id })
  return rows.length > 0
}
