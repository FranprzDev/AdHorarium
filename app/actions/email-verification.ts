"use server"

import { headers } from "next/headers"
import { getDb } from "@/db/client"
import { consumeUserToken, findVerificationUserById, markEmailVerified, replaceUserToken } from "@/db/queries/tokens"
import { runAction, type ActionResult } from "@/lib/action-result"
import { resolveAppOrigin } from "@/lib/app-origin"
import { getClientKey } from "@/lib/auth/client-key"
import {
  EMAIL_VERIFICATION_CONFIRM_RATE_LIMITS,
  EMAIL_VERIFICATION_RESEND_RATE_LIMITS,
  confirmEmail,
  resendEmailVerification,
  type EmailConfirmationResult,
  type EmailVerificationResendResult,
} from "@/lib/auth/email-verification"
import { requireUserId } from "@/lib/auth/session"
import { sendMail } from "@/lib/mail/server"
import { SlidingWindowRateLimiter } from "@/lib/rate-limit"
import { EmailVerificationErrorCode, UserTokenPurpose } from "@/types/enums"

const resendLimiter = new SlidingWindowRateLimiter(EMAIL_VERIFICATION_RESEND_RATE_LIMITS)
const confirmLimiter = new SlidingWindowRateLimiter(EMAIL_VERIFICATION_CONFIRM_RATE_LIMITS)

const UNAVAILABLE_MESSAGE = "No pudimos completar el pedido. Probá de nuevo en unos minutos."

export type EmailVerificationStatus = {
  email: string
  verified: boolean
}

export async function getEmailVerificationStatusAction(): Promise<ActionResult<EmailVerificationStatus | null>> {
  return runAction(async () => {
    const user = await findVerificationUserById(getDb(), await requireUserId())
    if (!user) return null
    return { email: user.email, verified: user.emailVerified !== null }
  })
}

export async function resendEmailVerificationAction(): Promise<EmailVerificationResendResult> {
  try {
    const userId = await requireUserId()
    const db = getDb()
    return await resendEmailVerification(userId, resolveAppOrigin(await headers()), {
      limiter: resendLimiter,
      findUser: (id) => findVerificationUserById(db, id),
      saveToken: (token) => replaceUserToken(db, token),
      sendMail,
    })
  } catch (error) {
    console.error("Email verification resend failed", error instanceof Error ? error.name : typeof error)
    return { ok: false, code: EmailVerificationErrorCode.Unavailable, message: UNAVAILABLE_MESSAGE }
  }
}

export async function confirmEmailAction(token: string): Promise<EmailConfirmationResult> {
  try {
    const db = getDb()
    return await confirmEmail(token, getClientKey(await headers()), {
      limiter: confirmLimiter,
      consumeToken: (tokenHash) => consumeUserToken(db, UserTokenPurpose.EmailVerification, tokenHash),
      markVerified: (userId) => markEmailVerified(db, userId),
    })
  } catch (error) {
    console.error("Email confirmation failed", error instanceof Error ? error.name : typeof error)
    return { ok: false, code: EmailVerificationErrorCode.Unavailable, message: UNAVAILABLE_MESSAGE }
  }
}
