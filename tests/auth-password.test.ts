import { describe, expect, it } from "vitest"
import { BCRYPT_COST, hashPassword, verifyPassword } from "@/lib/auth/password"

const TEST_COST = 4

describe("password hashing", () => {
  it("uses a production work factor of at least 12", () => {
    expect(BCRYPT_COST).toBeGreaterThanOrEqual(12)
  })

  it("stores a salted bcrypt hash, never the password itself", async () => {
    const password = "correcto-horse-42"
    const first = await hashPassword(password, TEST_COST)
    const second = await hashPassword(password, TEST_COST)
    expect(first).toMatch(/^\$2[aby]\$04\$/)
    expect(first).not.toContain(password)
    expect(first).not.toBe(second)
  })

  it("verifies the right password and rejects a wrong one", async () => {
    const hash = await hashPassword("correcto-horse-42", TEST_COST)
    await expect(verifyPassword("correcto-horse-42", hash, TEST_COST)).resolves.toBe(true)
    await expect(verifyPassword("correcto-horse-43", hash, TEST_COST)).resolves.toBe(false)
  })

  it("rejects any password when the account has no stored hash", async () => {
    await expect(verifyPassword("anything-at-all-1", null, TEST_COST)).resolves.toBe(false)
  })
})
