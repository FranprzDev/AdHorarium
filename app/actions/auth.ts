"use server"

import { headers } from "next/headers"
import { after } from "next/server"
import { getDb } from "@/db/client"
import { createCredentialStudent } from "@/db/queries/auth"
import { findVerificationUserByEmail, replaceUserToken } from "@/db/queries/tokens"
import { resolveAppOrigin } from "@/lib/app-origin"
import { getClientKey } from "@/lib/auth/client-key"
import { sendEmailVerification } from "@/lib/auth/email-verification"
import { REGISTRATION_RATE_LIMITS, registerStudent, type RegistrationResult } from "@/lib/auth/registration"
import { sendMail } from "@/lib/mail/server"
import { SlidingWindowRateLimiter } from "@/lib/rate-limit"
import type { RegisterInput } from "@/lib/validation/auth"
import { RegistrationErrorCode } from "@/types/enums"

const registrationLimiter = new SlidingWindowRateLimiter(REGISTRATION_RATE_LIMITS)

function scheduleVerificationEmail(email: string, appOrigin: string): void {
  after(async () => {
    try {
      const db = getDb()
      const user = await findVerificationUserByEmail(db, email)
      if (!user || user.emailVerified) return
      const result = await sendEmailVerification(user, appOrigin, { saveToken: (token) => replaceUserToken(db, token), sendMail })
      console.info("Verification email handled", result.status)
    } catch (error) {
      console.error("Verification email failed", error instanceof Error ? error.name : typeof error)
    }
  })
}

export async function registerStudentAction(input: RegisterInput): Promise<RegistrationResult> {
  try {
    const requestHeaders = await headers()
    const result = await registerStudent(input, getClientKey(requestHeaders), {
      createStudent: (student) => createCredentialStudent(getDb(), student),
      limiter: registrationLimiter,
    })
    if (result.ok) scheduleVerificationEmail(result.email, resolveAppOrigin(requestHeaders))
    return result
  } catch (error) {
    // Log only the error class: the input holds the password and must never reach the logs.
    console.error("Student registration failed", error instanceof Error ? error.name : typeof error)
    return { ok: false, code: RegistrationErrorCode.Unavailable, message: "No pudimos crear la cuenta. Probá de nuevo en unos minutos." }
  }
}
