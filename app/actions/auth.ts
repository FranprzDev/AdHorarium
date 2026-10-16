"use server"

import { headers } from "next/headers"
import { getDb } from "@/db/client"
import { createCredentialStudent } from "@/db/queries/auth"
import { getClientKey } from "@/lib/auth/client-key"
import { REGISTRATION_RATE_LIMITS, registerStudent, type RegistrationResult } from "@/lib/auth/registration"
import { SlidingWindowRateLimiter } from "@/lib/rate-limit"
import type { RegisterInput } from "@/lib/validation/auth"
import { RegistrationErrorCode } from "@/types/enums"

const registrationLimiter = new SlidingWindowRateLimiter(REGISTRATION_RATE_LIMITS)

export async function registerStudentAction(input: RegisterInput): Promise<RegistrationResult> {
  try {
    return await registerStudent(input, getClientKey(await headers()), {
      createStudent: (student) => createCredentialStudent(getDb(), student),
      limiter: registrationLimiter,
    })
  } catch (error) {
    // Log only the error class: the input holds the password and must never reach the logs.
    console.error("Student registration failed", error instanceof Error ? error.name : typeof error)
    return { ok: false, code: RegistrationErrorCode.Unavailable, message: "No pudimos crear la cuenta. Probá de nuevo en unos minutos." }
  }
}
