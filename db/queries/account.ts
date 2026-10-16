import { and, eq, exists, ne, or } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import type { AppDatabase } from "@/db/client"
import { mailOutbox, users, verificationTokens } from "@/db/schema"
import { AccountDeletionOutcome, UserRole } from "@/types/enums"

export type DeletableAccount = {
  id: string
  email: string
  role: UserRole
  passwordHash: string | null
}

export async function findDeletableAccount(db: AppDatabase, userId: string): Promise<DeletableAccount | null> {
  const [row] = await db
    .select({ id: users.id, email: users.email, role: users.role, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return row ?? null
}

/**
 * Deletes the user in one statement, so it is atomic: foreign keys cascade to subject states, schedule entries, share
 * links, user tokens, OAuth accounts and sessions. An admin is deleted only while another admin exists.
 */
export async function deleteUserAccount(db: AppDatabase, userId: string): Promise<AccountDeletionOutcome> {
  const otherAdmins = alias(users, "other_admins")
  const deleted = await db
    .delete(users)
    .where(
      and(
        eq(users.id, userId),
        or(
          ne(users.role, UserRole.Admin),
          exists(
            db
              .select({ id: otherAdmins.id })
              .from(otherAdmins)
              .where(and(eq(otherAdmins.role, UserRole.Admin), ne(otherAdmins.id, userId))),
          ),
        ),
      ),
    )
    .returning({ email: users.email })

  const [row] = deleted
  if (!row) return (await findDeletableAccount(db, userId)) ? AccountDeletionOutcome.LastAdmin : AccountDeletionOutcome.NotFound

  await db.delete(mailOutbox).where(eq(mailOutbox.recipient, row.email))
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, row.email))
  return AccountDeletionOutcome.Deleted
}
