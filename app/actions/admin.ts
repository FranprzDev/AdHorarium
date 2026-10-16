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
import { applyCommissionImport, previewCommissionImport, type CommissionImportResult } from "@/db/queries/commission-import"
import { createCommission, deleteCommission, listSubjectCommissions, updateCommission } from "@/db/queries/schedule"
import { runAction, type ActionResult } from "@/lib/action-result"
import type { CommissionImportPlan } from "@/lib/schedule/commission-import"
import type { AdminCommission } from "@/lib/schedule/types"
import {
  commissionImportInputSchema,
  createCommissionInputSchema,
  deleteCommissionInputSchema,
  updateCommissionInputSchema,
  type CommissionImportInput,
  type CreateCommissionInput,
  type DeleteCommissionInput,
  type UpdateCommissionInput,
} from "@/lib/schedule/validation"
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

export async function listSubjectCommissionsAction(subjectId: number): Promise<ActionResult<AdminCommission[]>> {
  return runAction(async () => {
    await requireAdminUserId()
    return listSubjectCommissions(getDb(), subjectIdInputSchema.parse({ subjectId }).subjectId)
  })
}

export async function createCommissionAction(input: CreateCommissionInput): Promise<ActionResult<number>> {
  return runAction(async () => {
    await requireAdminUserId()
    const { subjectId, ...fields } = createCommissionInputSchema.parse(input)
    return createCommission(getDb(), subjectId, fields)
  })
}

export async function updateCommissionAction(input: UpdateCommissionInput): Promise<ActionResult<null>> {
  return runAction(async () => {
    await requireAdminUserId()
    const { id, ...fields } = updateCommissionInputSchema.parse(input)
    await updateCommission(getDb(), id, fields)
    return null
  })
}

/** Returns how many student entries were turned into custom entries. */
export async function deleteCommissionAction(input: DeleteCommissionInput): Promise<ActionResult<number>> {
  return runAction(async () => {
    await requireAdminUserId()
    return deleteCommission(getDb(), deleteCommissionInputSchema.parse(input))
  })
}

/** Reads an import file and compares it with the catalog without writing anything. */
export async function previewCommissionImportAction(input: CommissionImportInput): Promise<ActionResult<CommissionImportPlan>> {
  return runAction(async () => {
    await requireAdminUserId()
    return previewCommissionImport(getDb(), commissionImportInputSchema.parse(input).content)
  })
}

/** Creates and updates the commissions of an import file; refuses files with blocking errors. */
export async function applyCommissionImportAction(input: CommissionImportInput): Promise<ActionResult<CommissionImportResult>> {
  return runAction(async () => {
    await requireAdminUserId()
    return applyCommissionImport(getDb(), commissionImportInputSchema.parse(input).content, new Date())
  })
}
