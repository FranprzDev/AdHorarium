import { UserRole } from "@/types/enums"

const USER_ROLE_VALUES = new Set<string>(Object.values(UserRole))

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLE_VALUES.has(value)
}

export function isAdminEmail(email: string | null | undefined, adminEmails: ReadonlyArray<string>): boolean {
  if (!email) return false
  return adminEmails.includes(email.trim().toLowerCase())
}

export function resolveRoleOnSignIn(
  email: string | null | undefined,
  adminEmails: ReadonlyArray<string>,
  currentRole: UserRole,
): UserRole {
  return isAdminEmail(email, adminEmails) ? UserRole.Admin : currentRole
}

export function isAdmin(role: UserRole | null | undefined): boolean {
  return role === UserRole.Admin
}

export enum ProtectedArea {
  Dashboard = "/dashboard",
  Admin = "/admin",
}

export enum AccessDecision {
  Allow = "allow",
  RequireSignIn = "require_sign_in",
  Forbidden = "forbidden",
}

export function decideAccess(pathname: string, role: UserRole | null): AccessDecision {
  const inArea = (area: ProtectedArea) => pathname === area || pathname.startsWith(`${area}/`)
  if (inArea(ProtectedArea.Admin)) {
    if (!role) return AccessDecision.RequireSignIn
    return isAdmin(role) ? AccessDecision.Allow : AccessDecision.Forbidden
  }
  if (inArea(ProtectedArea.Dashboard)) return role ? AccessDecision.Allow : AccessDecision.RequireSignIn
  return AccessDecision.Allow
}
