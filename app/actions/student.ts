"use server"

import { getDb } from "@/db/client"
import {
  getStudentProfile,
  getUserCareerId,
  listUserSubjectStates,
  setUserCareer,
  upsertUserSubjectState,
  type StudentProfile,
} from "@/db/queries/student"
import { runAction, type ActionResult } from "@/lib/action-result"
import { requireUserId } from "@/lib/auth/session"
import { careerIdInputSchema, updateSubjectStateInputSchema, type UpdateSubjectStateInput } from "@/lib/validation/student"
import type { UserSubjectStates } from "@/types/types"

export async function getMyCareerIdAction(): Promise<ActionResult<number | null>> {
  return runAction(async () => getUserCareerId(getDb(), await requireUserId()))
}

export async function selectMyCareerAction(careerId: number): Promise<ActionResult<number>> {
  return runAction(async () => {
    const userId = await requireUserId()
    const input = careerIdInputSchema.parse({ careerId })
    await setUserCareer(getDb(), userId, input.careerId)
    return input.careerId
  })
}

export async function getMySubjectStatesAction(careerId: number): Promise<ActionResult<UserSubjectStates>> {
  return runAction(async () => {
    const userId = await requireUserId()
    const input = careerIdInputSchema.parse({ careerId })
    return listUserSubjectStates(getDb(), userId, input.careerId)
  })
}

export async function updateMySubjectStateAction(input: UpdateSubjectStateInput): Promise<ActionResult<null>> {
  return runAction(async () => {
    const userId = await requireUserId()
    await upsertUserSubjectState(getDb(), userId, updateSubjectStateInputSchema.parse(input))
    return null
  })
}

export async function getMyProfileAction(): Promise<ActionResult<StudentProfile>> {
  return runAction(async () => getStudentProfile(getDb(), await requireUserId()))
}
