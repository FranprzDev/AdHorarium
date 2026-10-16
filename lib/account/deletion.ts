import type { DeletableAccount } from "@/db/queries/account"
import { MINUTE_MS, type RateLimitRule, type SlidingWindowRateLimiter } from "@/lib/rate-limit"
import { accountDeletionInputSchema } from "@/lib/validation/account"
import { AccountDeletionConfirmation, AccountDeletionErrorCode, AccountDeletionOutcome } from "@/types/enums"

export const ACCOUNT_DELETION_RATE_LIMITS: ReadonlyArray<RateLimitRule> = [{ limit: 5, windowMs: 15 * MINUTE_MS }]

const INVALID_PASSWORD_MESSAGE = "La contraseña no es correcta."
const INVALID_EMAIL_MESSAGE = "El email no coincide con el de tu cuenta."
const LAST_ADMIN_MESSAGE = "Sos el único administrador. Asigná otro administrador antes de eliminar tu cuenta."
const RATE_LIMITED_MESSAGE = "Hiciste demasiados intentos. Esperá unos minutos y probá de nuevo."
const UNAVAILABLE_MESSAGE = "No pudimos eliminar tu cuenta. Probá de nuevo en unos minutos."

export type AccountDeletionFailure = { ok: false; code: AccountDeletionErrorCode; message: string }
export type AccountDeletionResult = { ok: true } | AccountDeletionFailure

export function confirmationFor(account: Pick<DeletableAccount, "passwordHash">): AccountDeletionConfirmation {
  return account.passwordHash === null ? AccountDeletionConfirmation.Email : AccountDeletionConfirmation.Password
}

function failure(code: AccountDeletionErrorCode, message: string): AccountDeletionFailure {
  return { ok: false, code, message }
}

export type AccountDeletionDependencies = {
  limiter: SlidingWindowRateLimiter
  findAccount: (userId: string) => Promise<DeletableAccount | null>
  verifyPassword: (password: string, passwordHash: string) => Promise<boolean>
  deleteAccount: (userId: string) => Promise<AccountDeletionOutcome>
}

export async function deleteOwnAccount(userId: string, rawInput: unknown, dependencies: AccountDeletionDependencies): Promise<AccountDeletionResult> {
  const account = await dependencies.findAccount(userId)
  if (!account) return failure(AccountDeletionErrorCode.Unavailable, UNAVAILABLE_MESSAGE)
  const confirmation = confirmationFor(account)
  const invalidMessage = confirmation === AccountDeletionConfirmation.Password ? INVALID_PASSWORD_MESSAGE : INVALID_EMAIL_MESSAGE

  const parsed = accountDeletionInputSchema.safeParse(rawInput)
  if (!parsed.success) return failure(AccountDeletionErrorCode.InvalidConfirmation, invalidMessage)
  if (!dependencies.limiter.consume(userId).allowed) return failure(AccountDeletionErrorCode.RateLimited, RATE_LIMITED_MESSAGE)

  const confirmed =
    account.passwordHash === null
      ? parsed.data.confirmation.trim().toLowerCase() === account.email.toLowerCase()
      : await dependencies.verifyPassword(parsed.data.confirmation, account.passwordHash)
  if (!confirmed) return failure(AccountDeletionErrorCode.InvalidConfirmation, invalidMessage)

  const outcome = await dependencies.deleteAccount(userId)
  if (outcome === AccountDeletionOutcome.LastAdmin) return failure(AccountDeletionErrorCode.LastAdmin, LAST_ADMIN_MESSAGE)
  if (outcome === AccountDeletionOutcome.NotFound) return failure(AccountDeletionErrorCode.Unavailable, UNAVAILABLE_MESSAGE)
  return { ok: true }
}
