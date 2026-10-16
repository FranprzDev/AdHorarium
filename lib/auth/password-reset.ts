import type { CredentialUserRecord } from "@/db/queries/auth"
import type { NewUserToken } from "@/db/queries/tokens"
import { hashPassword } from "@/lib/auth/password"
import { PASSWORD_RESET_PATH, PASSWORD_RESET_TTL_MINUTES } from "@/lib/auth/password-reset-config"
import { hashToken, issueToken } from "@/lib/auth/tokens"
import { buildGoogleAccountResetMail, buildPasswordResetMail } from "@/lib/mail/templates"
import type { MailDeliveryResult, MailMessage } from "@/lib/mail/types"
import { DAY_MS, MINUTE_MS, type RateLimitRule, type SlidingWindowRateLimiter } from "@/lib/rate-limit"
import { passwordResetInputSchema, passwordResetRequestSchema } from "@/lib/validation/auth"
import { type MailDeliveryStatus, PasswordResetDelivery, PasswordResetErrorCode, UserTokenPurpose } from "@/types/enums"

export const PASSWORD_RESET_EMAIL_RATE_LIMITS: ReadonlyArray<RateLimitRule> = [
  { limit: 3, windowMs: 15 * MINUTE_MS },
  { limit: 10, windowMs: DAY_MS },
]

export const PASSWORD_RESET_CLIENT_RATE_LIMITS: ReadonlyArray<RateLimitRule> = [
  { limit: 10, windowMs: 15 * MINUTE_MS },
  { limit: 50, windowMs: DAY_MS },
]

export const RESET_PASSWORD_CLIENT_RATE_LIMITS: ReadonlyArray<RateLimitRule> = [{ limit: 10, windowMs: 15 * MINUTE_MS }]

const RATE_LIMITED_MESSAGE = "Hiciste demasiados pedidos. Esperá unos minutos y probá de nuevo."
const INVALID_TOKEN_MESSAGE = "El enlace no es válido, ya se usó o venció. Pedí uno nuevo."
const UNAVAILABLE_MESSAGE = "No pudimos cambiar la contraseña. Probá de nuevo en unos minutos."
const INVALID_INPUT_MESSAGE = "Revisá los datos ingresados"

export type PasswordResetFailure = { ok: false; code: PasswordResetErrorCode; message: string }
export type PasswordResetRequestResult = { ok: true; email: string } | PasswordResetFailure
export type PasswordResetResult = { ok: true } | PasswordResetFailure

function failure(code: PasswordResetErrorCode, message: string): PasswordResetFailure {
  return { ok: false, code, message }
}

export type PasswordResetRequestLimiters = {
  emailLimiter: SlidingWindowRateLimiter
  clientLimiter: SlidingWindowRateLimiter
}

export function acceptPasswordResetRequest(rawInput: unknown, clientKey: string, limiters: PasswordResetRequestLimiters): PasswordResetRequestResult {
  const parsed = passwordResetRequestSchema.safeParse(rawInput)
  if (!parsed.success) return failure(PasswordResetErrorCode.InvalidInput, parsed.error.issues[0]?.message ?? INVALID_INPUT_MESSAGE)
  if (!limiters.clientLimiter.consume(clientKey).allowed) return failure(PasswordResetErrorCode.RateLimited, RATE_LIMITED_MESSAGE)
  if (!limiters.emailLimiter.consume(parsed.data.email).allowed) return failure(PasswordResetErrorCode.RateLimited, RATE_LIMITED_MESSAGE)
  return { ok: true, email: parsed.data.email }
}

export type PasswordResetDeliveryDependencies = {
  findUserByEmail: (email: string) => Promise<CredentialUserRecord | null>
  saveToken: (token: NewUserToken) => Promise<void>
  sendMail: (message: MailMessage) => Promise<MailDeliveryResult>
  now?: () => Date
}

export type PasswordResetDeliveryResult = {
  delivery: PasswordResetDelivery
  status: MailDeliveryStatus | null
}

export async function deliverPasswordReset(
  email: string,
  appOrigin: string,
  dependencies: PasswordResetDeliveryDependencies,
): Promise<PasswordResetDeliveryResult> {
  const user = await dependencies.findUserByEmail(email)
  if (!user) return { delivery: PasswordResetDelivery.NoAccount, status: null }

  if (user.passwordHash === null) {
    const result = await dependencies.sendMail(buildGoogleAccountResetMail(user.email, user.name, `${appOrigin}/ingresar`))
    return { delivery: PasswordResetDelivery.GoogleAccount, status: result.status }
  }

  const now = dependencies.now?.() ?? new Date()
  const { token, tokenHash } = issueToken()
  await dependencies.saveToken({
    userId: user.id,
    purpose: UserTokenPurpose.PasswordReset,
    tokenHash,
    expiresAt: new Date(now.getTime() + PASSWORD_RESET_TTL_MINUTES * MINUTE_MS),
  })
  const resetUrl = `${appOrigin}${PASSWORD_RESET_PATH}?token=${encodeURIComponent(token)}`
  const result = await dependencies.sendMail(buildPasswordResetMail(user.email, user.name, resetUrl, PASSWORD_RESET_TTL_MINUTES))
  return { delivery: PasswordResetDelivery.ResetLink, status: result.status }
}

export type PasswordResetDependencies = {
  limiter: SlidingWindowRateLimiter
  consumeToken: (tokenHash: string) => Promise<string | null>
  updatePasswordHash: (userId: string, passwordHash: string) => Promise<boolean>
  invalidateTokens: (userId: string) => Promise<void>
  bcryptCost?: number
}

export async function resetPassword(rawInput: unknown, clientKey: string, dependencies: PasswordResetDependencies): Promise<PasswordResetResult> {
  const parsed = passwordResetInputSchema.safeParse(rawInput)
  if (!parsed.success) return failure(PasswordResetErrorCode.InvalidInput, parsed.error.issues[0]?.message ?? INVALID_INPUT_MESSAGE)
  if (!dependencies.limiter.consume(clientKey).allowed) return failure(PasswordResetErrorCode.RateLimited, RATE_LIMITED_MESSAGE)

  const passwordHash = await hashPassword(parsed.data.password, dependencies.bcryptCost)
  const userId = await dependencies.consumeToken(hashToken(parsed.data.token))
  if (!userId) return failure(PasswordResetErrorCode.InvalidToken, INVALID_TOKEN_MESSAGE)

  const updated = await dependencies.updatePasswordHash(userId, passwordHash)
  if (!updated) return failure(PasswordResetErrorCode.Unavailable, UNAVAILABLE_MESSAGE)
  await dependencies.invalidateTokens(userId)
  return { ok: true }
}
