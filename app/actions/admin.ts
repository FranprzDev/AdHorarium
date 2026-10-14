"use server"

import { getDb } from "@/db/client"
import {
  addCorrelative,
  createSubject,
  deleteSubject,
  listAdminSubjects,
  listSubjectCorrelatives,
  removeCorrelative,
  updateSubject,
  type AdminCorrelative,
  type AdminSubject,
} from "@/db/queries/admin"
import { runAction, type ActionResult } from "@/lib/action-result"
import { requireAdminUserId } from "@/lib/auth/session"
import {
  adminSubjectFiltersSchema,
  correlativeIdInputSchema,
  correlativeInputSchema,
  createSubjectInputSchema,
  subjectIdInputSchema,
  updateSubjectInputSchema,
  type AdminSubjectFilters,
  type CorrelativeInput,
  type CreateSubjectInput,
  type UpdateSubjectInput,
} from "@/lib/validation/admin"

export async function listAdminSubjectsAction(filters: AdminSubjectFilters): Promise<ActionResult<AdminSubject[]>> {
  return runAction(async () => {
    await requireAdminUserId()
    return listAdminSubjects(getDb(), adminSubjectFiltersSchema.parse(filters))
  })
}

export async function createSubjectAction(input: CreateSubjectInput): Promise<ActionResult<number>> {
  return runAction(async () => {
    await requireAdminUserId()
    return createSubject(getDb(), createSubjectInputSchema.parse(input))
  })
}

export async function updateSubjectAction(input: UpdateSubjectInput): Promise<ActionResult<null>> {
  return runAction(async () => {
    await requireAdminUserId()
    await updateSubject(getDb(), updateSubjectInputSchema.parse(input))
    return null
  })
}

export async function deleteSubjectAction(subjectId: number): Promise<ActionResult<null>> {
  return runAction(async () => {
    await requireAdminUserId()
    await deleteSubject(getDb(), subjectIdInputSchema.parse({ subjectId }).subjectId)
    return null
  })
}

export async function listSubjectCorrelativesAction(subjectId: number): Promise<ActionResult<AdminCorrelative[]>> {
  return runAction(async () => {
    await requireAdminUserId()
    return listSubjectCorrelatives(getDb(), subjectIdInputSchema.parse({ subjectId }).subjectId)
  })
}

export async function addCorrelativeAction(input: CorrelativeInput): Promise<ActionResult<number>> {
  return runAction(async () => {
    await requireAdminUserId()
    return addCorrelative(getDb(), correlativeInputSchema.parse(input))
  })
}

export async function removeCorrelativeAction(correlativeId: number): Promise<ActionResult<null>> {
  return runAction(async () => {
    await requireAdminUserId()
    await removeCorrelative(getDb(), correlativeIdInputSchema.parse({ correlativeId }).correlativeId)
    return null
  })
}
