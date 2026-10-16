import { PGlite } from "@electric-sql/pglite"
import { asc, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import * as schema from "@/db/schema"
import { deleteUserAccount, findDeletableAccount } from "@/db/queries/account"
import { seedDatabase } from "@/db/seed/seed-database"
import { confirmationFor, deleteOwnAccount, type AccountDeletionDependencies } from "@/lib/account/deletion"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { issueToken } from "@/lib/auth/tokens"
import { SlidingWindowRateLimiter } from "@/lib/rate-limit"
import {
  AccountDeletionConfirmation,
  AccountDeletionErrorCode,
  AccountDeletionOutcome,
  CareerCode,
  ClassDay,
  MailKind,
  ScheduleEntryKind,
  SubjectStatus,
  UserRole,
  UserTokenPurpose,
} from "@/types/enums"

const TEST_COST = 4
const PASSWORD = "materias2026"
const client = new PGlite()
const db = drizzle({ client, schema })
let careerId = 0
let subjectId = 0

function dependencies(overrides: Partial<AccountDeletionDependencies> = {}): AccountDeletionDependencies {
  return {
    limiter: new SlidingWindowRateLimiter([{ limit: 100, windowMs: 60_000 }]),
    findAccount: (userId) => findDeletableAccount(db, userId),
    verifyPassword: (password, passwordHash) => verifyPassword(password, passwordHash, TEST_COST),
    deleteAccount: (userId) => deleteUserAccount(db, userId),
    ...overrides,
  }
}

async function insertUser(id: string, email: string, role: UserRole, password: string | null): Promise<void> {
  await db.insert(schema.users).values({
    id,
    email,
    name: id,
    role,
    careerId,
    passwordHash: password ? await hashPassword(password, TEST_COST) : null,
  })
}

async function giveUserData(userId: string, email: string): Promise<void> {
  await db.insert(schema.userSubjectStates).values({ userId, subjectId, status: SubjectStatus.Regular })
  await db.insert(schema.scheduleEntries).values({
    userId,
    subjectId,
    kind: ScheduleEntryKind.Custom,
    label: "Mi comisión",
    slots: [{ day: ClassDay.Lunes, start: "08:00", end: "10:00", classroom: null }],
  })
  await db.insert(schema.scheduleShares).values({ id: `share-${userId}`, userId, careerId, displayName: null, entries: [] })
  await db.insert(schema.userTokens).values({
    userId,
    purpose: UserTokenPurpose.PasswordReset,
    tokenHash: issueToken().tokenHash,
    expiresAt: new Date(Date.now() + 60_000),
  })
  await db.insert(schema.accounts).values({ userId, type: "oidc", provider: "google", providerAccountId: `google-${userId}` })
  await db.insert(schema.sessions).values({ sessionToken: `session-${userId}`, userId, expires: new Date(Date.now() + 60_000) })
  await db.insert(schema.mailOutbox).values({ recipient: email, kind: MailKind.PasswordReset, subject: "s", textBody: "t", htmlBody: "h" })
  await db.insert(schema.verificationTokens).values({ identifier: email, token: `vt-${userId}`, expires: new Date(Date.now() + 60_000) })
}

async function countRows(userId: string, email: string) {
  const [states, entries, shares, tokens, accounts, sessions, outbox, verification] = await Promise.all([
    db.select().from(schema.userSubjectStates).where(eq(schema.userSubjectStates.userId, userId)),
    db.select().from(schema.scheduleEntries).where(eq(schema.scheduleEntries.userId, userId)),
    db.select().from(schema.scheduleShares).where(eq(schema.scheduleShares.userId, userId)),
    db.select().from(schema.userTokens).where(eq(schema.userTokens.userId, userId)),
    db.select().from(schema.accounts).where(eq(schema.accounts.userId, userId)),
    db.select().from(schema.sessions).where(eq(schema.sessions.userId, userId)),
    db.select().from(schema.mailOutbox).where(eq(schema.mailOutbox.recipient, email)),
    db.select().from(schema.verificationTokens).where(eq(schema.verificationTokens.identifier, email)),
  ])
  return {
    states: states.length,
    entries: entries.length,
    shares: shares.length,
    tokens: tokens.length,
    accounts: accounts.length,
    sessions: sessions.length,
    outbox: outbox.length,
    verification: verification.length,
  }
}

const NOTHING = { states: 0, entries: 0, shares: 0, tokens: 0, accounts: 0, sessions: 0, outbox: 0, verification: 0 }
const EVERYTHING = { states: 1, entries: 1, shares: 1, tokens: 1, accounts: 1, sessions: 1, outbox: 1, verification: 1 }

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" })
  await seedDatabase(db)
  const [career] = await db.select().from(schema.careers).where(eq(schema.careers.code, CareerCode.Sistemas))
  careerId = career.id
  const [subject] = await db.select({ id: schema.subjects.id }).from(schema.subjects).where(eq(schema.subjects.careerId, careerId)).orderBy(asc(schema.subjects.id)).limit(1)
  subjectId = subject.id
  await insertUser("student", "student@example.com", UserRole.Student, PASSWORD)
  await insertUser("neighbour", "neighbour@example.com", UserRole.Student, PASSWORD)
  await insertUser("google-only", "google@example.com", UserRole.Student, null)
  await insertUser("admin-a", "admin-a@example.com", UserRole.Admin, PASSWORD)
  await insertUser("admin-b", "admin-b@example.com", UserRole.Admin, PASSWORD)
  await giveUserData("student", "student@example.com")
  await giveUserData("neighbour", "neighbour@example.com")
}, 60_000)

afterAll(async () => {
  await client.close()
})

describe("confirmationFor", () => {
  it("asks for the password, or for the email when the account has none", () => {
    expect(confirmationFor({ passwordHash: "hash" })).toBe(AccountDeletionConfirmation.Password)
    expect(confirmationFor({ passwordHash: null })).toBe(AccountDeletionConfirmation.Email)
  })
})

describe("deleteOwnAccount", () => {
  it("keeps the account when the password is wrong or missing", async () => {
    expect(await deleteOwnAccount("student", { confirmation: "otra2026clave" }, dependencies())).toMatchObject({
      code: AccountDeletionErrorCode.InvalidConfirmation,
    })
    expect(await deleteOwnAccount("student", { confirmation: "" }, dependencies())).toMatchObject({ code: AccountDeletionErrorCode.InvalidConfirmation })
    expect(await deleteOwnAccount("student", {}, dependencies())).toMatchObject({ code: AccountDeletionErrorCode.InvalidConfirmation })
    expect(await countRows("student", "student@example.com")).toEqual(EVERYTHING)
  })

  it("deletes the user and every row it owns, and nothing of other users", async () => {
    expect(await deleteOwnAccount("student", { confirmation: PASSWORD }, dependencies())).toEqual({ ok: true })
    expect(await findDeletableAccount(db, "student")).toBeNull()
    expect(await countRows("student", "student@example.com")).toEqual(NOTHING)
    expect(await countRows("neighbour", "neighbour@example.com")).toEqual(EVERYTHING)
    const subjects = await db.select({ id: schema.subjects.id }).from(schema.subjects).where(eq(schema.subjects.id, subjectId))
    expect(subjects).toHaveLength(1)
  })

  it("lets a Google-only account confirm with its email, case-insensitively", async () => {
    expect(await deleteOwnAccount("google-only", { confirmation: "otro@example.com" }, dependencies())).toMatchObject({
      code: AccountDeletionErrorCode.InvalidConfirmation,
    })
    expect(await deleteOwnAccount("google-only", { confirmation: " Google@Example.com " }, dependencies())).toEqual({ ok: true })
    expect(await findDeletableAccount(db, "google-only")).toBeNull()
  })

  it("never deletes the last admin", async () => {
    expect(await deleteOwnAccount("admin-a", { confirmation: PASSWORD }, dependencies())).toEqual({ ok: true })
    const result = await deleteOwnAccount("admin-b", { confirmation: PASSWORD }, dependencies())
    expect(result).toMatchObject({ ok: false, code: AccountDeletionErrorCode.LastAdmin })
    expect(await findDeletableAccount(db, "admin-b")).not.toBeNull()
    expect(await deleteUserAccount(db, "admin-b")).toBe(AccountDeletionOutcome.LastAdmin)
  })

  it("rate limits confirmation attempts per user", async () => {
    const limiter = new SlidingWindowRateLimiter([{ limit: 1, windowMs: 60_000 }])
    await deleteOwnAccount("neighbour", { confirmation: "mala2026clave" }, dependencies({ limiter }))
    expect(await deleteOwnAccount("neighbour", { confirmation: PASSWORD }, dependencies({ limiter }))).toMatchObject({
      code: AccountDeletionErrorCode.RateLimited,
    })
    expect(await findDeletableAccount(db, "neighbour")).not.toBeNull()
  })

  it("reports an unknown user as unavailable", async () => {
    expect(await deleteOwnAccount("ghost", { confirmation: PASSWORD }, dependencies())).toMatchObject({ code: AccountDeletionErrorCode.Unavailable })
    expect(await deleteUserAccount(db, "ghost")).toBe(AccountDeletionOutcome.NotFound)
  })
})
