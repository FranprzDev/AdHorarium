import type { NewCredentialStudent } from "@/db/queries/auth"
import { hashPassword } from "@/lib/auth/password"
import { DAY_MS, MINUTE_MS, type RateLimitRule, type SlidingWindowRateLimiter } from "@/lib/rate-limit"
import { registerInputSchema } from "@/lib/validation/auth"
import { RegistrationErrorCode } from "@/types/enums"

/** Accounts a single client address can create. */
export const REGISTRATION_RATE_LIMITS: ReadonlyArray<RateLimitRule> = [
  { limit: 5, windowMs: 60 * MINUTE_MS },
  { limit: 20, windowMs: DAY_MS },
]

const UNAVAILABLE_MESSAGE = "No pudimos crear la cuenta con ese email. Si ya tenés una cuenta, iniciá sesión."
const RATE_LIMITED_MESSAGE = "Hiciste demasiados intentos. Probá de nuevo más tarde."

export type RegistrationResult = { ok: true; email: string } | { ok: false; code: RegistrationErrorCode; message: string }

export type RegistrationDependencies = {
  createStudent: (input: NewCredentialStudent) => Promise<boolean>
  limiter: SlidingWindowRateLimiter
  bcryptCost?: number
}

/** Registers a student account (role student). The password is only ever stored as a bcrypt hash. */
export async function registerStudent(
  rawInput: unknown,
  clientKey: string,
  dependencies: RegistrationDependencies,
): Promise<RegistrationResult> {
  const parsed = registerInputSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      ok: false,
      code: RegistrationErrorCode.InvalidInput,
      message: parsed.error.issues[0]?.message ?? "Revisá los datos ingresados",
    }
  }
  if (!dependencies.limiter.consume(clientKey).allowed) {
    return { ok: false, code: RegistrationErrorCode.RateLimited, message: RATE_LIMITED_MESSAGE }
  }

  const { name, email, password } = parsed.data
  const passwordHash = await hashPassword(password, dependencies.bcryptCost)
  const created = await dependencies.createStudent({ name, email, passwordHash })
  if (!created) return { ok: false, code: RegistrationErrorCode.Unavailable, message: UNAVAILABLE_MESSAGE }
  return { ok: true, email }
}
