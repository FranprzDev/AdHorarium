import type { CredentialUserRecord } from "@/db/queries/auth"
import { verifyPassword } from "@/lib/auth/password"
import { MINUTE_MS, type RateLimitRule, type SlidingWindowRateLimiter } from "@/lib/rate-limit"
import { signInInputSchema } from "@/lib/validation/auth"
import { CredentialsErrorCode } from "@/types/enums"

/** Sign in attempts allowed per email address (successful ones included). */
export const SIGN_IN_EMAIL_RATE_LIMITS: ReadonlyArray<RateLimitRule> = [{ limit: 8, windowMs: 15 * MINUTE_MS }]

/** Sign in attempts allowed per client address, across every email. */
export const SIGN_IN_CLIENT_RATE_LIMITS: ReadonlyArray<RateLimitRule> = [{ limit: 30, windowMs: 15 * MINUTE_MS }]

export type AuthenticatedUser = {
  id: string
  email: string
  name: string | null
  image: string | null
}

export type CredentialsAuthorizeResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; code: CredentialsErrorCode }

export type CredentialsAuthorizeDependencies = {
  findUserByEmail: (email: string) => Promise<CredentialUserRecord | null>
  emailLimiter: SlidingWindowRateLimiter
  clientLimiter: SlidingWindowRateLimiter
  /** bcrypt cost used for the timing guard; tests lower it to keep the suite fast. */
  bcryptCost?: number
}

/**
 * Checks an email + password pair. Every failure that depends on the account (unknown email,
 * Google-only account, wrong password, malformed input) collapses into the same code.
 */
export async function authorizeCredentials(
  rawInput: unknown,
  clientKey: string,
  dependencies: CredentialsAuthorizeDependencies,
): Promise<CredentialsAuthorizeResult> {
  if (!dependencies.clientLimiter.consume(clientKey).allowed) return { ok: false, code: CredentialsErrorCode.RateLimited }

  const parsed = signInInputSchema.safeParse(rawInput)
  if (!parsed.success) return { ok: false, code: CredentialsErrorCode.InvalidCredentials }
  const { email, password } = parsed.data

  if (!dependencies.emailLimiter.consume(email).allowed) return { ok: false, code: CredentialsErrorCode.RateLimited }

  const user = await dependencies.findUserByEmail(email)
  const passwordMatches = await verifyPassword(password, user?.passwordHash ?? null, dependencies.bcryptCost)
  if (!user || !passwordMatches) return { ok: false, code: CredentialsErrorCode.InvalidCredentials }

  return { ok: true, user: { id: user.id, email: user.email, name: user.name, image: user.image } }
}
