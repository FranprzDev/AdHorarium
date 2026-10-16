import type { NewUserToken, VerificationUserRecord } from "@/db/queries/tokens"
import { EMAIL_VERIFICATION_PATH, EMAIL_VERIFICATION_TTL_HOURS } from "@/lib/auth/email-verification-config"
import { hashToken, issueToken } from "@/lib/auth/tokens"
import { buildEmailVerificationMail } from "@/lib/mail/templates"
import type { MailDeliveryResult, MailMessage } from "@/lib/mail/types"
import { DAY_MS, MINUTE_MS, type RateLimitRule, type SlidingWindowRateLimiter } from "@/lib/rate-limit"
import { emailTokenSchema } from "@/lib/validation/auth"
import { EmailVerificationErrorCode, UserTokenPurpose } from "@/types/enums"

const HOUR_MS = 60 * MINUTE_MS

export const EMAIL_VERIFICATION_RESEND_RATE_LIMITS: ReadonlyArray<RateLimitRule> = [
  { limit: 3, windowMs: 15 * MINUTE_MS },
  { limit: 10, windowMs: DAY_MS },
]

export const EMAIL_VERIFICATION_CONFIRM_RATE_LIMITS: ReadonlyArray<RateLimitRule> = [{ limit: 20, windowMs: 15 * MINUTE_MS }]

const INVALID_TOKEN_MESSAGE = "El enlace no es válido, ya se usó o venció. Pedí uno nuevo desde el aviso en tu panel."
const RATE_LIMITED_MESSAGE = "Hiciste demasiados pedidos. Esperá unos minutos y probá de nuevo."
const ALREADY_VERIFIED_MESSAGE = "Tu email ya está confirmado."

export type EmailVerificationFailure = { ok: false; code: EmailVerificationErrorCode; message: string }
export type EmailConfirmationResult = { ok: true } | EmailVerificationFailure
export type EmailVerificationResendResult = { ok: true; email: string } | EmailVerificationFailure

function failure(code: EmailVerificationErrorCode, message: string): EmailVerificationFailure {
  return { ok: false, code, message }
}

export type EmailVerificationDeliveryDependencies = {
  saveToken: (token: NewUserToken) => Promise<void>
  sendMail: (message: MailMessage) => Promise<MailDeliveryResult>
  now?: () => Date
}

export async function sendEmailVerification(
  user: Pick<VerificationUserRecord, "id" | "email" | "name">,
  appOrigin: string,
  dependencies: EmailVerificationDeliveryDependencies,
): Promise<MailDeliveryResult> {
  const now = dependencies.now?.() ?? new Date()
  const { token, tokenHash } = issueToken()
  await dependencies.saveToken({
    userId: user.id,
    purpose: UserTokenPurpose.EmailVerification,
    tokenHash,
    expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_TTL_HOURS * HOUR_MS),
  })
  const verifyUrl = `${appOrigin}${EMAIL_VERIFICATION_PATH}?token=${encodeURIComponent(token)}`
  return dependencies.sendMail(buildEmailVerificationMail(user.email, user.name, verifyUrl, EMAIL_VERIFICATION_TTL_HOURS))
}

export type EmailVerificationResendDependencies = EmailVerificationDeliveryDependencies & {
  limiter: SlidingWindowRateLimiter
  findUser: (userId: string) => Promise<VerificationUserRecord | null>
}

export async function resendEmailVerification(
  userId: string,
  appOrigin: string,
  dependencies: EmailVerificationResendDependencies,
): Promise<EmailVerificationResendResult> {
  const user = await dependencies.findUser(userId)
  if (!user || user.emailVerified) return failure(EmailVerificationErrorCode.AlreadyVerified, ALREADY_VERIFIED_MESSAGE)
  if (!dependencies.limiter.consume(userId).allowed) return failure(EmailVerificationErrorCode.RateLimited, RATE_LIMITED_MESSAGE)
  await sendEmailVerification(user, appOrigin, dependencies)
  return { ok: true, email: user.email }
}

export type EmailConfirmationDependencies = {
  limiter: SlidingWindowRateLimiter
  consumeToken: (tokenHash: string) => Promise<string | null>
  markVerified: (userId: string) => Promise<void>
}

export async function confirmEmail(rawToken: unknown, clientKey: string, dependencies: EmailConfirmationDependencies): Promise<EmailConfirmationResult> {
  const token = emailTokenSchema.safeParse(rawToken)
  if (!token.success) return failure(EmailVerificationErrorCode.InvalidToken, INVALID_TOKEN_MESSAGE)
  if (!dependencies.limiter.consume(clientKey).allowed) return failure(EmailVerificationErrorCode.RateLimited, RATE_LIMITED_MESSAGE)
  const userId = await dependencies.consumeToken(hashToken(token.data))
  if (!userId) return failure(EmailVerificationErrorCode.InvalidToken, INVALID_TOKEN_MESSAGE)
  await dependencies.markVerified(userId)
  return { ok: true }
}
