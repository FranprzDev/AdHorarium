import { and, eq, gt, isNull } from "drizzle-orm"
import type { AppDatabase } from "@/db/client"
import { userTokens, users } from "@/db/schema"
import type { UserTokenPurpose } from "@/types/enums"

export type NewUserToken = {
  userId: string
  purpose: UserTokenPurpose
  tokenHash: string
  expiresAt: Date
}

export async function invalidateUserTokens(db: AppDatabase, userId: string, purpose: UserTokenPurpose, now: Date = new Date()): Promise<void> {
  await db
    .update(userTokens)
    .set({ usedAt: now })
    .where(and(eq(userTokens.userId, userId), eq(userTokens.purpose, purpose), isNull(userTokens.usedAt)))
}

export async function replaceUserToken(db: AppDatabase, token: NewUserToken, now: Date = new Date()): Promise<void> {
  await invalidateUserTokens(db, token.userId, token.purpose, now)
  await db.insert(userTokens).values(token)
}

export async function consumeUserToken(
  db: AppDatabase,
  purpose: UserTokenPurpose,
  tokenHash: string,
  now: Date = new Date(),
): Promise<string | null> {
  const [row] = await db
    .update(userTokens)
    .set({ usedAt: now })
    .where(and(eq(userTokens.tokenHash, tokenHash), eq(userTokens.purpose, purpose), isNull(userTokens.usedAt), gt(userTokens.expiresAt, now)))
    .returning({ userId: userTokens.userId })
  return row?.userId ?? null
}

export async function updateUserPasswordHash(db: AppDatabase, userId: string, passwordHash: string): Promise<boolean> {
  const rows = await db.update(users).set({ passwordHash }).where(eq(users.id, userId)).returning({ id: users.id })
  return rows.length > 0
}
