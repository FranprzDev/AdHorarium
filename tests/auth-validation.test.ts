import { describe, expect, it } from "vitest"
import { safeCallbackPath, DEFAULT_AFTER_SIGN_IN_PATH } from "@/lib/auth/callback"
import { getClientKey } from "@/lib/auth/client-key"
import { MAX_PASSWORD_BYTES, registerInputSchema, signInInputSchema } from "@/lib/validation/auth"

const validRegistration = {
  name: "  Ana Estudiante ",
  email: "  Ana@Example.COM ",
  password: "materias2026",
  confirmPassword: "materias2026",
}

describe("registration validation", () => {
  it("normalizes the email and trims the name", () => {
    const parsed = registerInputSchema.parse(validRegistration)
    expect(parsed.email).toBe("ana@example.com")
    expect(parsed.name).toBe("Ana Estudiante")
  })

  it.each([
    ["too short", "abc12", "La contraseña debe tener al menos 10 caracteres"],
    ["letters only", "solamenteletras", "La contraseña debe combinar letras y números"],
    ["digits only", "12345678901", "La contraseña debe combinar letras y números"],
  ])("rejects a password that is %s", (_label, password, message) => {
    const result = registerInputSchema.safeParse({ ...validRegistration, password, confirmPassword: password })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(message)
  })

  it("rejects passwords longer than bcrypt can hash", () => {
    const password = `a1${"ñ".repeat(MAX_PASSWORD_BYTES / 2)}`
    const result = registerInputSchema.safeParse({ ...validRegistration, password, confirmPassword: password })
    expect(result.success).toBe(false)
  })

  it("rejects mismatched confirmation", () => {
    const result = registerInputSchema.safeParse({ ...validRegistration, confirmPassword: "materias2027" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"])
  })

  it("rejects an invalid email", () => {
    expect(registerInputSchema.safeParse({ ...validRegistration, email: "ana@" }).success).toBe(false)
  })
})

describe("sign in validation", () => {
  it("does not apply strength rules to existing passwords", () => {
    expect(signInInputSchema.safeParse({ email: "ana@example.com", password: "x" }).success).toBe(true)
  })

  it("requires both fields", () => {
    expect(signInInputSchema.safeParse({ email: "ana@example.com" }).success).toBe(false)
    expect(signInInputSchema.safeParse({ password: "secret" }).success).toBe(false)
  })
})

describe("callback path", () => {
  it.each([
    ["/admin", "/admin"],
    ["/dashboard/mesas?x=1", "/dashboard/mesas?x=1"],
    ["https://evil.example", DEFAULT_AFTER_SIGN_IN_PATH],
    ["//evil.example", DEFAULT_AFTER_SIGN_IN_PATH],
    ["/\\evil.example", DEFAULT_AFTER_SIGN_IN_PATH],
    [undefined, DEFAULT_AFTER_SIGN_IN_PATH],
  ])("maps %s to %s", (candidate, expected) => {
    expect(safeCallbackPath(candidate)).toBe(expected)
  })
})

describe("client key", () => {
  it("uses the first forwarded hop", () => {
    expect(getClientKey(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7")
  })

  it("falls back to a shared bucket when no address is present", () => {
    expect(getClientKey(new Headers())).toBe("unknown")
  })
})
