import { describe, expect, it } from "vitest"
import { AccessDecision, decideAccess, isAdmin, isAdminEmail, isUserRole, resolveRoleOnSignIn } from "@/lib/auth/roles"
import { UserRole } from "@/types/enums"

const ADMINS = ["franutn23@gmail.com", "franciscoperezdeveloper@gmail.com"]

describe("role mapping", () => {
  it("recognises admin emails case-insensitively", () => {
    expect(isAdminEmail("FranUTN23@gmail.com ", ADMINS)).toBe(true)
    expect(isAdminEmail("someone@gmail.com", ADMINS)).toBe(false)
    expect(isAdminEmail(null, ADMINS)).toBe(false)
  })

  it("promotes listed emails and keeps the stored role otherwise", () => {
    expect(resolveRoleOnSignIn("franciscoperezdeveloper@gmail.com", ADMINS, UserRole.Student)).toBe(UserRole.Admin)
    expect(resolveRoleOnSignIn("someone@gmail.com", ADMINS, UserRole.Student)).toBe(UserRole.Student)
    expect(resolveRoleOnSignIn("someone@gmail.com", ADMINS, UserRole.Admin)).toBe(UserRole.Admin)
    expect(resolveRoleOnSignIn(undefined, [], UserRole.Student)).toBe(UserRole.Student)
  })

  it("validates role values", () => {
    expect(isUserRole("admin")).toBe(true)
    expect(isUserRole("ADMIN")).toBe(false)
    expect(isUserRole(undefined)).toBe(false)
    expect(isAdmin(UserRole.Admin)).toBe(true)
    expect(isAdmin(UserRole.Student)).toBe(false)
    expect(isAdmin(null)).toBe(false)
  })
})

describe("route access", () => {
  it("lets anyone open public pages", () => {
    expect(decideAccess("/", null)).toBe(AccessDecision.Allow)
    expect(decideAccess("/careers", null)).toBe(AccessDecision.Allow)
    expect(decideAccess("/privacidad", null)).toBe(AccessDecision.Allow)
    expect(decideAccess("/dashboarding", null)).toBe(AccessDecision.Allow)
  })

  it("requires a session for the dashboard", () => {
    expect(decideAccess("/dashboard", null)).toBe(AccessDecision.RequireSignIn)
    expect(decideAccess("/dashboard/materias", null)).toBe(AccessDecision.RequireSignIn)
    expect(decideAccess("/dashboard/materias", UserRole.Student)).toBe(AccessDecision.Allow)
  })

  it("requires the admin role for the admin panel", () => {
    expect(decideAccess("/admin", null)).toBe(AccessDecision.RequireSignIn)
    expect(decideAccess("/admin/subjects", UserRole.Student)).toBe(AccessDecision.Forbidden)
    expect(decideAccess("/admin", UserRole.Admin)).toBe(AccessDecision.Allow)
  })
})
