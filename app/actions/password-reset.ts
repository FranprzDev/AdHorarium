"use server"

import { headers } from "next/headers"
import { after } from "next/server"
import { getDb } from "@/db/client"
import { findCredentialUserByEmail } from "@/db/queries/auth"
import { consumeUserToken, invalidateUserTokens, markEmailVerified, replaceUserToken, updateUserPasswordHash } from "@/db/queries/tokens"
import { resolveAppOrigin } from "@/lib/app-origin"
import { getClientKey } from "@/lib/auth/client-key"
import {
  PASSWORD_RESET_CLIENT_RATE_LIMITS,
  PASSWORD_RESET_EMAIL_RATE_LIMITS,
  RESET_PASSWORD_CLIENT_RATE_LIMITS,
  acceptPasswordResetRequest,
  deliverPasswordReset,
  resetPassword,
  type PasswordResetRequestResult,
  type PasswordResetResult,
} from "@/lib/auth/password-reset"
import { sendMail } from "@/lib/mail/server"
import { SlidingWindowRateLimiter } from "@/lib/rate-limit"
import type { PasswordResetInput, PasswordResetRequestInput } from "@/lib/validation/auth"
import { PasswordResetErrorCode, UserTokenPurpose } from "@/types/enums"

const requestEmailLimiter = new SlidingWindowRateLimiter(PASSWORD_RESET_EMAIL_RATE_LIMITS)
const requestClientLimiter = new SlidingWindowRateLimiter(PASSWORD_RESET_CLIENT_RATE_LIMITS)
const resetClientLimiter = new SlidingWindowRateLimiter(RESET_PASSWORD_CLIENT_RATE_LIMITS)

export type PasswordResetRequestActionResult = { ok: true } | Extract<PasswordResetRequestResult, { ok: false }>

export async function requestPasswordResetAction(input: PasswordResetRequestInput): Promise<PasswordResetRequestActionResult> {
  const requestHeaders = await headers()
  const accepted = acceptPasswordResetRequest(input, getClientKey(requestHeaders), {
    emailLimiter: requestEmailLimiter,
    clientLimiter: requestClientLimiter,
  })
  if (!accepted.ok) return accepted

  const appOrigin = resolveAppOrigin(requestHeaders)
  after(async () => {
    try {
      const db = getDb()
      const result = await deliverPasswordReset(accepted.email, appOrigin, {
        findUserByEmail: (email) => findCredentialUserByEmail(db, email),
        saveToken: (token) => replaceUserToken(db, token),
        sendMail,
      })
      console.info("Password reset request handled", result.delivery, result.status)
    } catch (error) {
      console.error("Password reset delivery failed", error instanceof Error ? error.name : typeof error)
    }
  })
  return { ok: true }
}

export async function resetPasswordAction(input: PasswordResetInput): Promise<PasswordResetResult> {
  try {
    const db = getDb()
    return await resetPassword(input, getClientKey(await headers()), {
      limiter: resetClientLimiter,
      consumeToken: (tokenHash) => consumeUserToken(db, UserTokenPurpose.PasswordReset, tokenHash),
      updatePasswordHash: (userId, passwordHash) => updateUserPasswordHash(db, userId, passwordHash),
      invalidateTokens: (userId) => invalidateUserTokens(db, userId, UserTokenPurpose.PasswordReset),
      markEmailVerified: (userId) => markEmailVerified(db, userId),
    })
  } catch (error) {
    console.error("Password reset failed", error instanceof Error ? error.name : typeof error)
    return { ok: false, code: PasswordResetErrorCode.Unavailable, message: "No pudimos cambiar la contraseña. Probá de nuevo en unos minutos." }
  }
}
