import { describe, expect, it } from "vitest"
import { MissingEnvError, getAdminEmails, getDatabaseUrl, parseEmailList, readRequiredEnv } from "@/lib/env"
import { EnvVar } from "@/types/enums"

describe("env", () => {
  it("returns a trimmed required value", () => {
    expect(readRequiredEnv(EnvVar.DatabaseUrl, { DATABASE_URL: "  postgres://x  " })).toBe("postgres://x")
  })

  it("throws a typed error when a variable is missing or blank", () => {
    expect(() => readRequiredEnv(EnvVar.DatabaseUrl, {})).toThrow(MissingEnvError)
    expect(() => readRequiredEnv(EnvVar.DatabaseUrl, { DATABASE_URL: "   " })).toThrow("DATABASE_URL")
  })

  it("reads DATABASE_URL without falling back to other variables", () => {
    expect(() => getDatabaseUrl({ DATABASE_URL_UNPOOLED: "postgres://x", STORAGE_DATABASE_URL: "postgres://y" })).toThrow(
      MissingEnvError,
    )
    expect(getDatabaseUrl({ DATABASE_URL: "postgres://pooled" })).toBe("postgres://pooled")
  })

  it("parses an email list case-insensitively without blanks or duplicates", () => {
    expect(parseEmailList(" A@x.com, b@y.com ,,a@X.com ")).toEqual(["a@x.com", "b@y.com"])
    expect(parseEmailList("")).toEqual([])
  })

  it("requires ADMIN_EMAILS to be set", () => {
    expect(() => getAdminEmails({})).toThrow(MissingEnvError)
    expect(getAdminEmails({ ADMIN_EMAILS: "franutn23@gmail.com" })).toEqual(["franutn23@gmail.com"])
  })
})
