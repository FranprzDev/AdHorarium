import { PGlite } from "@electric-sql/pglite"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import * as schema from "@/db/schema"
import { consumeUserToken, findVerificationUserByEmail, findVerificationUserById, markEmailVerified, replaceUserToken } from "@/db/queries/tokens"
import { EMAIL_VERIFICATION_PATH } from "@/lib/auth/email-verification-config"
import {
  confirmEmail,
  resendEmailVerification,
  sendEmailVerification,
  type EmailConfirmationDependencies,
  type EmailVerificationResendDependencies,
} from "@/lib/auth/email-verification"
import { hashToken } from "@/lib/auth/tokens"
import type { MailMessage } from "@/lib/mail/types"
import { SlidingWindowRateLimiter } from "@/lib/rate-limit"
import { EmailVerificationErrorCode, MailDeliveryStatus, MailKind, MailProviderKind, UserTokenPurpose } from "@/types/enums"

const ORIGIN = "http://localhost:3000"
const DEMO_EMAILS = ["estudiante.demo@adhorarium.app", "admin.demo@adhorarium.app"]
const client = new PGlite()
const db = drizzle({ client, schema })

function generousLimiter() {
  return new SlidingWindowRateLimiter([{ limit: 100, windowMs: 60_000 }])
}

function sender(sent: MailMessage[]) {
  return async (message: MailMessage) => {
    sent.push(message)
    return { status: MailDeliveryStatus.Sent, provider: MailProviderKind.Outbox }
  }
}

function resendDependencies(sent: MailMessage[], overrides: Partial<EmailVerificationResendDependencies> = {}): EmailVerificationResendDependencies {
  return {
    limiter: generousLimiter(),
    findUser: (userId) => findVerificationUserById(db, userId),
    saveToken: (token) => replaceUserToken(db, token),
    sendMail: sender(sent),
    ...overrides,
  }
}

function confirmDependencies(overrides: Partial<EmailConfirmationDependencies> = {}): EmailConfirmationDependencies {
  return {
    limiter: generousLimiter(),
    consumeToken: (tokenHash) => consumeUserToken(db, UserTokenPurpose.EmailVerification, tokenHash),
    markVerified: (userId) => markEmailVerified(db, userId),
    ...overrides,
  }
}

function tokenFrom(message: MailMessage): string {
  const match = /verificar-email\?token=([A-Za-z0-9_-]+)/.exec(message.text)
  if (!match) throw new Error("No verification link in the email")
  return match[1]
}

async function isVerified(userId: string): Promise<boolean> {
  return (await findVerificationUserById(db, userId))?.emailVerified instanceof Date
}

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" })
  await db.insert(schema.users).values([
    { id: "student", email: "student@example.com", name: "Student", passwordHash: "x" },
    { id: "other", email: "other@example.com", name: "Other", passwordHash: "x" },
  ])
}, 60_000)

afterAll(async () => {
  await client.close()
})

describe("sendEmailVerification", () => {
  it("emails a 24 hour single-use link and stores only its hash", async () => {
    const sent: MailMessage[] = []
    const now = new Date("2026-10-16T12:00:00Z")
    await sendEmailVerification({ id: "student", email: "student@example.com", name: "Student" }, ORIGIN, {
      saveToken: (token) => replaceUserToken(db, token),
      sendMail: sender(sent),
      now: () => now,
    })
    expect(sent[0].kind).toBe(MailKind.EmailVerification)
    expect(sent[0].text).toContain(`${ORIGIN}${EMAIL_VERIFICATION_PATH}?token=`)
    const [row] = await db.select().from(schema.userTokens).where(eq(schema.userTokens.tokenHash, hashToken(tokenFrom(sent[0]))))
    expect(row.purpose).toBe(UserTokenPurpose.EmailVerification)
    expect(row.expiresAt.getTime() - now.getTime()).toBe(24 * 60 * 60_000)
  })
})

describe("confirmEmail", () => {
  it("verifies the account once and rejects the link afterwards", async () => {
    const sent: MailMessage[] = []
    expect(await resendEmailVerification("student", ORIGIN, resendDependencies(sent))).toEqual({ ok: true, email: "student@example.com" })
    const token = tokenFrom(sent[0])
    expect(await isVerified("student")).toBe(false)
    expect(await confirmEmail(token, "ip", confirmDependencies())).toEqual({ ok: true })
    expect(await isVerified("student")).toBe(true)
    expect(await confirmEmail(token, "ip", confirmDependencies())).toMatchObject({ code: EmailVerificationErrorCode.InvalidToken })
  })

  it("does not accept a password reset token as a verification token", async () => {
    const { issueToken } = await import("@/lib/auth/tokens")
    const reset = issueToken()
    await db.insert(schema.userTokens).values({
      userId: "other",
      purpose: UserTokenPurpose.PasswordReset,
      tokenHash: reset.tokenHash,
      expiresAt: new Date(Date.now() + 60_000),
    })
    expect(await confirmEmail(reset.token, "ip", confirmDependencies())).toMatchObject({ code: EmailVerificationErrorCode.InvalidToken })
    expect(await isVerified("other")).toBe(false)
  })

  it("rejects malformed and expired tokens and rate limits per client", async () => {
    expect(await confirmEmail("", "ip", confirmDependencies())).toMatchObject({ code: EmailVerificationErrorCode.InvalidToken })
    expect(await confirmEmail(123, "ip", confirmDependencies())).toMatchObject({ code: EmailVerificationErrorCode.InvalidToken })
    const sent: MailMessage[] = []
    await sendEmailVerification({ id: "other", email: "other@example.com", name: null }, ORIGIN, {
      saveToken: (token) => replaceUserToken(db, token),
      sendMail: sender(sent),
      now: () => new Date(Date.now() - 25 * 60 * 60_000),
    })
    expect(await confirmEmail(tokenFrom(sent[0]), "ip", confirmDependencies())).toMatchObject({ code: EmailVerificationErrorCode.InvalidToken })
    const limiter = new SlidingWindowRateLimiter([{ limit: 1, windowMs: 60_000 }])
    await confirmEmail("made-up", "ip", confirmDependencies({ limiter }))
    expect(await confirmEmail("made-up", "ip", confirmDependencies({ limiter }))).toMatchObject({ code: EmailVerificationErrorCode.RateLimited })
  })
})

describe("resendEmailVerification", () => {
  it("refuses verified accounts and rate limits per user", async () => {
    const sent: MailMessage[] = []
    expect(await resendEmailVerification("student", ORIGIN, resendDependencies(sent))).toMatchObject({ code: EmailVerificationErrorCode.AlreadyVerified })
    const limiter = new SlidingWindowRateLimiter([{ limit: 1, windowMs: 60_000 }])
    expect((await resendEmailVerification("other", ORIGIN, resendDependencies(sent, { limiter }))).ok).toBe(true)
    expect(await resendEmailVerification("other", ORIGIN, resendDependencies(sent, { limiter }))).toMatchObject({ code: EmailVerificationErrorCode.RateLimited })
    expect(sent).toHaveLength(1)
  })

  it("only the newest link works", async () => {
    const sent: MailMessage[] = []
    await resendEmailVerification("other", ORIGIN, resendDependencies(sent))
    await resendEmailVerification("other", ORIGIN, resendDependencies(sent))
    const [older, newer] = sent.map(tokenFrom)
    expect(await confirmEmail(older, "ip", confirmDependencies())).toMatchObject({ code: EmailVerificationErrorCode.InvalidToken })
    expect(await confirmEmail(newer, "ip", confirmDependencies())).toEqual({ ok: true })
  })

  it("finds accounts by email case-insensitively", async () => {
    expect((await findVerificationUserByEmail(db, "Other@Example.com"))?.id).toBe("other")
  })
})

describe("migration 0005_email_verification", () => {
  it("marks the demo accounts and Google accounts as verified", async () => {
    const fresh = new PGlite()
    const freshDb = drizzle({ client: fresh, schema })
    try {
      const { readMigrationFiles } = await import("drizzle-orm/migrator")
      const migrations = readMigrationFiles({ migrationsFolder: "drizzle" })
      const verificationIndex = migrations.findIndex((migration) => migration.sql.some((statement) => statement.includes("'email_verification'")))
      for (const migration of migrations.slice(0, verificationIndex)) {
        for (const statement of migration.sql) await fresh.exec(statement)
      }
      await freshDb.insert(schema.users).values([
        { id: "demo-student", email: DEMO_EMAILS[0] },
        { id: "demo-admin", email: DEMO_EMAILS[1] },
        { id: "google", email: "g@example.com" },
        { id: "plain", email: "p@example.com" },
      ])
      await freshDb.insert(schema.accounts).values({ userId: "google", type: "oidc", provider: "google", providerAccountId: "1" })
      for (const migration of migrations.slice(verificationIndex)) {
        for (const statement of migration.sql) await fresh.exec(statement)
      }
      const rows = await freshDb.select({ id: schema.users.id, emailVerified: schema.users.emailVerified }).from(schema.users)
      const verified = Object.fromEntries(rows.map((row) => [row.id, row.emailVerified !== null]))
      expect(verified).toEqual({ "demo-student": true, "demo-admin": true, google: true, plain: false })
    } finally {
      await fresh.close()
    }
  })
})
