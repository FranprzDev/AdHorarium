import { PGlite } from "@electric-sql/pglite"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import * as schema from "@/db/schema"
import { findCredentialUserByEmail } from "@/db/queries/auth"
import { storeOutboxMail } from "@/db/queries/mail"
import { consumeUserToken, invalidateUserTokens, replaceUserToken, updateUserPasswordHash } from "@/db/queries/tokens"
import { resolveAppOrigin } from "@/lib/app-origin"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { PASSWORD_RESET_PATH } from "@/lib/auth/password-reset-config"
import {
  acceptPasswordResetRequest,
  deliverPasswordReset,
  resetPassword,
  type PasswordResetDeliveryDependencies,
  type PasswordResetDependencies,
} from "@/lib/auth/password-reset"
import { hashToken, issueToken } from "@/lib/auth/tokens"
import type { MailMessage } from "@/lib/mail/types"
import { SlidingWindowRateLimiter } from "@/lib/rate-limit"
import { SITE_URL } from "@/lib/site"
import { MailDeliveryStatus, MailKind, MailProviderKind, PasswordResetDelivery, PasswordResetErrorCode, UserTokenPurpose } from "@/types/enums"

const TEST_COST = 4
const ORIGIN = "http://localhost:3000"
const OLD_PASSWORD = "materias2026"
const NEW_PASSWORD = "horarios2027"
const client = new PGlite()
const db = drizzle({ client, schema })

function generousLimiter() {
  return new SlidingWindowRateLimiter([{ limit: 100, windowMs: 60_000 }])
}

function deliveryDependencies(sent: MailMessage[], now?: () => Date): PasswordResetDeliveryDependencies {
  return {
    findUserByEmail: (email) => findCredentialUserByEmail(db, email),
    saveToken: (token) => replaceUserToken(db, token),
    sendMail: async (message) => {
      sent.push(message)
      await storeOutboxMail(db, message)
      return { status: MailDeliveryStatus.Sent, provider: MailProviderKind.Outbox }
    },
    now,
  }
}

function resetDependencies(overrides: Partial<PasswordResetDependencies> = {}): PasswordResetDependencies {
  return {
    limiter: generousLimiter(),
    consumeToken: (tokenHash) => consumeUserToken(db, UserTokenPurpose.PasswordReset, tokenHash),
    updatePasswordHash: (userId, passwordHash) => updateUserPasswordHash(db, userId, passwordHash),
    invalidateTokens: (userId) => invalidateUserTokens(db, userId, UserTokenPurpose.PasswordReset),
    bcryptCost: TEST_COST,
    ...overrides,
  }
}

function tokenFrom(message: MailMessage): string {
  const match = /restablecer\?token=([A-Za-z0-9_-]+)/.exec(message.text)
  if (!match) throw new Error("No reset link in the email")
  return match[1]
}

async function storedHash(userId: string): Promise<string | null> {
  const [row] = await db.select({ passwordHash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, userId))
  return row?.passwordHash ?? null
}

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" })
  await db.insert(schema.users).values([
    { id: "student", email: "student@example.com", name: "Student", passwordHash: await hashPassword(OLD_PASSWORD, TEST_COST) },
    { id: "google-only", email: "google@example.com", name: "Google" },
  ])
}, 60_000)

afterAll(async () => {
  await client.close()
})

describe("issueToken", () => {
  it("returns a url-safe token and stores only its SHA-256", () => {
    const { token, tokenHash } = issueToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(tokenHash).toBe(hashToken(token))
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/)
    expect(issueToken().token).not.toBe(token)
  })
})

describe("acceptPasswordResetRequest", () => {
  it("normalizes the email and rejects malformed input", () => {
    const limiters = { emailLimiter: generousLimiter(), clientLimiter: generousLimiter() }
    expect(acceptPasswordResetRequest({ email: " Ana@Example.com " }, "ip", limiters)).toEqual({ ok: true, email: "ana@example.com" })
    expect(acceptPasswordResetRequest({ email: "nope" }, "ip", limiters)).toMatchObject({ ok: false, code: PasswordResetErrorCode.InvalidInput })
  })

  it("rate limits per email and per client the same way for any address", () => {
    const limiters = { emailLimiter: new SlidingWindowRateLimiter([{ limit: 2, windowMs: 60_000 }]), clientLimiter: generousLimiter() }
    expect(acceptPasswordResetRequest({ email: "x@example.com" }, "a", limiters).ok).toBe(true)
    expect(acceptPasswordResetRequest({ email: "x@example.com" }, "b", limiters).ok).toBe(true)
    expect(acceptPasswordResetRequest({ email: "x@example.com" }, "c", limiters)).toMatchObject({ code: PasswordResetErrorCode.RateLimited })
    const clientLimited = { emailLimiter: generousLimiter(), clientLimiter: new SlidingWindowRateLimiter([{ limit: 1, windowMs: 60_000 }]) }
    acceptPasswordResetRequest({ email: "y@example.com" }, "ip", clientLimited)
    expect(acceptPasswordResetRequest({ email: "z@example.com" }, "ip", clientLimited)).toMatchObject({ code: PasswordResetErrorCode.RateLimited })
  })
})

describe("deliverPasswordReset", () => {
  it("sends nothing for an unknown email", async () => {
    const sent: MailMessage[] = []
    const result = await deliverPasswordReset("nobody@example.com", ORIGIN, deliveryDependencies(sent))
    expect(result).toEqual({ delivery: PasswordResetDelivery.NoAccount, status: null })
    expect(sent).toHaveLength(0)
  })

  it("tells a Google-only account to use Google and creates no token", async () => {
    const sent: MailMessage[] = []
    const result = await deliverPasswordReset("google@example.com", ORIGIN, deliveryDependencies(sent))
    expect(result.delivery).toBe(PasswordResetDelivery.GoogleAccount)
    expect(sent[0].kind).toBe(MailKind.PasswordResetGoogleAccount)
    expect(sent[0].text).toContain(`${ORIGIN}/ingresar`)
    const tokens = await db.select().from(schema.userTokens).where(eq(schema.userTokens.userId, "google-only"))
    expect(tokens).toHaveLength(0)
  })

  it("emails a 30 minute link and stores only the token hash", async () => {
    const sent: MailMessage[] = []
    const now = new Date("2026-10-16T12:00:00Z")
    await deliverPasswordReset("student@example.com", ORIGIN, deliveryDependencies(sent, () => now))
    const token = tokenFrom(sent[0])
    expect(sent[0].text).toContain(`${ORIGIN}${PASSWORD_RESET_PATH}?token=`)
    const [row] = await db.select().from(schema.userTokens).where(eq(schema.userTokens.tokenHash, hashToken(token)))
    expect(row.userId).toBe("student")
    expect(row.expiresAt.getTime() - now.getTime()).toBe(30 * 60_000)
    const outbox = await db.select().from(schema.mailOutbox).where(eq(schema.mailOutbox.recipient, "student@example.com"))
    expect(outbox.some((mail) => mail.textBody.includes(token))).toBe(true)
  })
})

describe("resetPassword", () => {
  it("sets the new password once and rejects the link afterwards", async () => {
    const sent: MailMessage[] = []
    await deliverPasswordReset("student@example.com", ORIGIN, deliveryDependencies(sent))
    const token = tokenFrom(sent[0])

    const result = await resetPassword({ token, password: NEW_PASSWORD, confirmPassword: NEW_PASSWORD }, "ip", resetDependencies())
    expect(result).toEqual({ ok: true })
    expect(await verifyPassword(NEW_PASSWORD, await storedHash("student"), TEST_COST)).toBe(true)

    const reused = await resetPassword({ token, password: "otraclave2028", confirmPassword: "otraclave2028" }, "ip", resetDependencies())
    expect(reused).toMatchObject({ ok: false, code: PasswordResetErrorCode.InvalidToken })
    expect(await verifyPassword(NEW_PASSWORD, await storedHash("student"), TEST_COST)).toBe(true)
  })

  it("keeps only the newest link valid", async () => {
    const sent: MailMessage[] = []
    await deliverPasswordReset("student@example.com", ORIGIN, deliveryDependencies(sent))
    await deliverPasswordReset("student@example.com", ORIGIN, deliveryDependencies(sent))
    const [older, newer] = sent.map(tokenFrom)
    const input = { password: OLD_PASSWORD, confirmPassword: OLD_PASSWORD }
    expect(await resetPassword({ ...input, token: older }, "ip", resetDependencies())).toMatchObject({ code: PasswordResetErrorCode.InvalidToken })
    expect(await resetPassword({ ...input, token: newer }, "ip", resetDependencies())).toEqual({ ok: true })
  })

  it("invalidates every other pending link after a reset", async () => {
    const userId = "student"
    const first = issueToken()
    const second = issueToken()
    const expiresAt = new Date(Date.now() + 60_000)
    await db.insert(schema.userTokens).values([
      { userId, purpose: UserTokenPurpose.PasswordReset, tokenHash: first.tokenHash, expiresAt },
      { userId, purpose: UserTokenPurpose.PasswordReset, tokenHash: second.tokenHash, expiresAt },
    ])
    const input = { password: NEW_PASSWORD, confirmPassword: NEW_PASSWORD }
    expect(await resetPassword({ ...input, token: first.token }, "ip", resetDependencies())).toEqual({ ok: true })
    expect(await resetPassword({ ...input, token: second.token }, "ip", resetDependencies())).toMatchObject({ code: PasswordResetErrorCode.InvalidToken })
  })

  it("rejects an expired link", async () => {
    const sent: MailMessage[] = []
    await deliverPasswordReset("student@example.com", ORIGIN, deliveryDependencies(sent, () => new Date(Date.now() - 31 * 60_000)))
    const result = await resetPassword({ token: tokenFrom(sent[0]), password: NEW_PASSWORD, confirmPassword: NEW_PASSWORD }, "ip", resetDependencies())
    expect(result).toMatchObject({ ok: false, code: PasswordResetErrorCode.InvalidToken })
  })

  it("does not burn the link when the new password is weak or does not match", async () => {
    const sent: MailMessage[] = []
    await deliverPasswordReset("student@example.com", ORIGIN, deliveryDependencies(sent))
    const token = tokenFrom(sent[0])
    expect(await resetPassword({ token, password: "corta1", confirmPassword: "corta1" }, "ip", resetDependencies())).toMatchObject({
      code: PasswordResetErrorCode.InvalidInput,
    })
    expect(await resetPassword({ token, password: NEW_PASSWORD, confirmPassword: "distinta2026" }, "ip", resetDependencies())).toMatchObject({
      code: PasswordResetErrorCode.InvalidInput,
    })
    expect(await resetPassword({ token, password: NEW_PASSWORD, confirmPassword: NEW_PASSWORD }, "ip", resetDependencies())).toEqual({ ok: true })
  })

  it("rejects unknown tokens and rate limits per client", async () => {
    const limiter = new SlidingWindowRateLimiter([{ limit: 1, windowMs: 60_000 }])
    const input = { token: "made-up", password: NEW_PASSWORD, confirmPassword: NEW_PASSWORD }
    expect(await resetPassword(input, "ip", resetDependencies({ limiter }))).toMatchObject({ code: PasswordResetErrorCode.InvalidToken })
    expect(await resetPassword(input, "ip", resetDependencies({ limiter }))).toMatchObject({ code: PasswordResetErrorCode.RateLimited })
  })
})

describe("resolveAppOrigin", () => {
  it("always uses the canonical origin in Vercel production", () => {
    const headers = new Headers({ host: "evil.example", "x-forwarded-proto": "https" })
    expect(resolveAppOrigin(headers, { VERCEL_ENV: "production" })).toBe(SITE_URL)
  })

  it("uses the request host for previews and local runs", () => {
    expect(resolveAppOrigin(new Headers({ host: "localhost:3000" }), {})).toBe("http://localhost:3000")
    expect(resolveAppOrigin(new Headers({ "x-forwarded-host": "pr-1.vercel.app", "x-forwarded-proto": "https" }), { VERCEL_ENV: "preview" })).toBe(
      "https://pr-1.vercel.app",
    )
  })
})
