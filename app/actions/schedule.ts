"use server"

import { getDb } from "@/db/client"
import { getUserCareer } from "@/db/queries/student"
import {
  ScheduleRuleError,
  createScheduleShare,
  deleteScheduleEntry,
  importScheduleShare,
  listCareerCommissions,
  listScheduleEntries,
  pickCommission,
  saveCustomEntry,
  updateCustomEntry,
} from "@/db/queries/schedule"
import { runAction, type ActionResult } from "@/lib/action-result"
import { requireUserId } from "@/lib/auth/session"
import { MINUTE_MS, DAY_MS, SlidingWindowRateLimiter } from "@/lib/rate-limit"
import { describeImport } from "@/lib/schedule/sharing"
import type { Commission, ScheduleEntry } from "@/lib/schedule/types"
import {
  createCustomEntryInputSchema,
  createShareInputSchema,
  entryIdInputSchema,
  importShareInputSchema,
  pickCommissionInputSchema,
  updateCustomEntryInputSchema,
  type CreateCustomEntryInput,
  type CreateShareInput,
  type ImportShareInput,
  type UpdateCustomEntryInput,
} from "@/lib/schedule/validation"

/** Share links per student: enough to resend a few versions, low enough to stop scripted abuse. */
const shareRateLimiter = new SlidingWindowRateLimiter([
  { limit: 5, windowMs: 10 * MINUTE_MS },
  { limit: 20, windowMs: DAY_MS },
])

export type MySchedule = {
  careerId: number
  careerName: string
  entries: ScheduleEntry[]
  commissions: Commission[]
}

export async function getMyScheduleAction(): Promise<ActionResult<MySchedule | null>> {
  return runAction(async () => {
    const userId = await requireUserId()
    const db = getDb()
    const career = await getUserCareer(db, userId)
    if (!career) return null
    const [entries, commissions] = await Promise.all([listScheduleEntries(db, userId, career.id), listCareerCommissions(db, career.id)])
    return { careerId: career.id, careerName: career.name, entries, commissions }
  })
}

export async function pickCommissionAction(commissionId: number): Promise<ActionResult<null>> {
  return runAction(async () => {
    const userId = await requireUserId()
    await pickCommission(getDb(), userId, pickCommissionInputSchema.parse({ commissionId }).commissionId)
    return null
  })
}

export async function saveCustomEntryAction(input: CreateCustomEntryInput): Promise<ActionResult<null>> {
  return runAction(async () => {
    const userId = await requireUserId()
    const parsed = createCustomEntryInputSchema.parse(input)
    await saveCustomEntry(getDb(), userId, parsed.subjectId, parsed.label, parsed.slots)
    return null
  })
}

export async function updateCustomEntryAction(input: UpdateCustomEntryInput): Promise<ActionResult<null>> {
  return runAction(async () => {
    const userId = await requireUserId()
    const parsed = updateCustomEntryInputSchema.parse(input)
    await updateCustomEntry(getDb(), userId, parsed.id, parsed.label, parsed.slots)
    return null
  })
}

export async function deleteScheduleEntryAction(entryId: number): Promise<ActionResult<null>> {
  return runAction(async () => {
    const userId = await requireUserId()
    await deleteScheduleEntry(getDb(), userId, entryIdInputSchema.parse({ entryId }).entryId)
    return null
  })
}

export async function createScheduleShareAction(input: CreateShareInput): Promise<ActionResult<string>> {
  return runAction(async () => {
    const userId = await requireUserId()
    const parsed = createShareInputSchema.parse(input)
    const decision = shareRateLimiter.consume(userId)
    if (!decision.allowed) {
      throw new ScheduleRuleError(`Creaste muchos enlaces seguidos. Probá de nuevo en ${Math.ceil(decision.retryAfterSeconds / 60)} min.`)
    }
    return createScheduleShare(getDb(), userId, parsed.displayName)
  })
}

export async function importScheduleShareAction(input: ImportShareInput): Promise<ActionResult<string>> {
  return runAction(async () => {
    const userId = await requireUserId()
    const plan = await importScheduleShare(getDb(), userId, importShareInputSchema.parse(input))
    return describeImport(plan)
  })
}
