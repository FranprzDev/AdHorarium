"use server"

import { signOut } from "@/auth"
import { getDb } from "@/db/client"
import { deleteUserAccount, findDeletableAccount } from "@/db/queries/account"
import { ACCOUNT_DELETION_RATE_LIMITS, confirmationFor, deleteOwnAccount, type AccountDeletionResult } from "@/lib/account/deletion"
import { runAction, type ActionResult } from "@/lib/action-result"
import { verifyPassword } from "@/lib/auth/password"
import { requireUserId } from "@/lib/auth/session"
import { SlidingWindowRateLimiter } from "@/lib/rate-limit"
import type { AccountDeletionInput } from "@/lib/validation/account"
import { AccountDeletionErrorCode, type AccountDeletionConfirmation } from "@/types/enums"

const deletionLimiter = new SlidingWindowRateLimiter(ACCOUNT_DELETION_RATE_LIMITS)

export type AccountDeletionRequirement = {
  email: string
  confirmation: AccountDeletionConfirmation
}

export async function getAccountDeletionRequirementAction(): Promise<ActionResult<AccountDeletionRequirement | null>> {
  return runAction(async () => {
    const account = await findDeletableAccount(getDb(), await requireUserId())
    if (!account) return null
    return { email: account.email, confirmation: confirmationFor(account) }
  })
}

export async function deleteMyAccountAction(input: AccountDeletionInput): Promise<AccountDeletionResult> {
  let result: AccountDeletionResult
  try {
    const userId = await requireUserId()
    const db = getDb()
    result = await deleteOwnAccount(userId, input, {
      limiter: deletionLimiter,
      findAccount: (id) => findDeletableAccount(db, id),
      verifyPassword: (password, passwordHash) => verifyPassword(password, passwordHash),
      deleteAccount: (id) => deleteUserAccount(db, id),
    })
  } catch (error) {
    console.error("Account deletion failed", error instanceof Error ? error.name : typeof error)
    return { ok: false, code: AccountDeletionErrorCode.Unavailable, message: "No pudimos eliminar tu cuenta. Probá de nuevo en unos minutos." }
  }
  if (result.ok) await signOut({ redirect: false })
  return result
}
