import { PGlite } from "@electric-sql/pglite"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import * as schema from "@/db/schema"
import { createCredentialStudent, findCredentialUserByEmail } from "@/db/queries/auth"
import { authorizeCredentials, type CredentialsAuthorizeDependencies } from "@/lib/auth/credentials"
import { hashPassword } from "@/lib/auth/password"
import { registerStudent } from "@/lib/auth/registration"
import { SlidingWindowRateLimiter } from "@/lib/rate-limit"
import { CredentialsErrorCode, RegistrationErrorCode, UserRole } from "@/types/enums"

const TEST_COST = 4
const PASSWORD = "materias2026"
const client = new PGlite()
const db = drizzle({ client, schema })

function dependencies(overrides: Partial<CredentialsAuthorizeDependencies> = {}): CredentialsAuthorizeDependencies {
  return {
    findUserByEmail: (email) => findCredentialUserByEmail(db, email),
    emailLimiter: new SlidingWindowRateLimiter([{ limit: 100, windowMs: 60_000 }]),
    clientLimiter: new SlidingWindowRateLimiter([{ limit: 100, windowMs: 60_000 }]),
    bcryptCost: TEST_COST,
    ...overrides,
  }
}

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" })
  await db.insert(schema.users).values([
    { id: "student", email: "student@example.com", name: "Student", passwordHash: await hashPassword(PASSWORD, TEST_COST) },
    { id: "google-only", email: "google@example.com", name: "Google" },
  ])
}, 60_000)

afterAll(async () => {
  await client.close()
})

describe("authorizeCredentials", () => {
  it("returns the user without its password hash on a valid pair", async () => {
    const result = await authorizeCredentials({ email: " Student@Example.com ", password: PASSWORD }, "ip", dependencies())
    expect(result).toEqual({
      ok: true,
      user: { id: "student", email: "student@example.com", name: "Student", image: null },
    })
  })

  it.each([
    ["a wrong password", { email: "student@example.com", password: "materias2027" }],
    ["an unknown email", { email: "nobody@example.com", password: PASSWORD }],
    ["a Google-only account", { email: "google@example.com", password: PASSWORD }],
    ["malformed input", { email: "not-an-email" }],
  ])("returns the same generic code for %s", async (_label, input) => {
    const result = await authorizeCredentials(input, "ip", dependencies())
    expect(result).toEqual({ ok: false, code: CredentialsErrorCode.InvalidCredentials })
  })

  it("rate limits repeated attempts on the same email", async () => {
    const deps = dependencies({ emailLimiter: new SlidingWindowRateLimiter([{ limit: 2, windowMs: 60_000 }]) })
    const wrong = { email: "student@example.com", password: "wrong-password-1" }
    await authorizeCredentials(wrong, "ip", deps)
    await authorizeCredentials(wrong, "ip", deps)
    const blocked = await authorizeCredentials({ email: "student@example.com", password: PASSWORD }, "ip", deps)
    expect(blocked).toEqual({ ok: false, code: CredentialsErrorCode.RateLimited })
  })

  it("rate limits a client that cycles through emails", async () => {
    const deps = dependencies({ clientLimiter: new SlidingWindowRateLimiter([{ limit: 1, windowMs: 60_000 }]) })
    await authorizeCredentials({ email: "a@example.com", password: "x" }, "203.0.113.7", deps)
    const blocked = await authorizeCredentials({ email: "b@example.com", password: "x" }, "203.0.113.7", deps)
    expect(blocked).toEqual({ ok: false, code: CredentialsErrorCode.RateLimited })
  })
})

describe("registerStudent", () => {
  const registration = { name: "Nueva", email: "Nueva@Example.com", password: PASSWORD, confirmPassword: PASSWORD }

  function registrationDeps(limit = 100) {
    return {
      createStudent: (input: Parameters<typeof createCredentialStudent>[1]) => createCredentialStudent(db, input),
      limiter: new SlidingWindowRateLimiter([{ limit, windowMs: 60_000 }]),
      bcryptCost: TEST_COST,
    }
  }

  it("creates a student with a hashed password that can then sign in", async () => {
    const result = await registerStudent(registration, "ip", registrationDeps())
    expect(result).toEqual({ ok: true, email: "nueva@example.com" })
    const [row] = await db.select().from(schema.users).where(eq(schema.users.email, "nueva@example.com"))
    expect(row.role).toBe(UserRole.Student)
    expect(row.passwordHash).not.toBe(PASSWORD)
    const signIn = await authorizeCredentials({ email: "nueva@example.com", password: PASSWORD }, "ip", dependencies())
    expect(signIn.ok).toBe(true)
  })

  it("refuses an email that already has an account", async () => {
    const result = await registerStudent({ ...registration, email: "google@example.com" }, "ip", registrationDeps())
    expect(result).toMatchObject({ ok: false, code: RegistrationErrorCode.Unavailable })
  })

  it("returns the first validation message for invalid input", async () => {
    const result = await registerStudent({ ...registration, confirmPassword: "otra2026xx" }, "ip", registrationDeps())
    expect(result).toEqual({ ok: false, code: RegistrationErrorCode.InvalidInput, message: "Las contraseñas no coinciden" })
  })

  it("rate limits account creation per client", async () => {
    const deps = registrationDeps(1)
    await registerStudent({ ...registration, email: "uno@example.com" }, "198.51.100.1", deps)
    const blocked = await registerStudent({ ...registration, email: "dos@example.com" }, "198.51.100.1", deps)
    expect(blocked).toMatchObject({ ok: false, code: RegistrationErrorCode.RateLimited })
  })
})
