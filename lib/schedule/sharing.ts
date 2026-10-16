import type { ScheduleEntry, SharedEntry } from "@/lib/schedule/types"
import { ScheduleEntryKind, ScheduleImportMode } from "@/types/enums"

const SHARE_ID_BYTES = 16

/** Unguessable share id: 128 random bits as base64url. */
export function createShareId(): string {
  const bytes = new Uint8Array(SHARE_ID_BYTES)
  crypto.getRandomValues(bytes)
  return Buffer.from(bytes).toString("base64url")
}

/** Snapshot stored in a share: commissions by reference, custom entries copied. No personal data. */
export function toSharedEntries(entries: ReadonlyArray<ScheduleEntry>): SharedEntry[] {
  const shared: SharedEntry[] = []
  for (const entry of entries) {
    if (entry.kind === ScheduleEntryKind.Commission && entry.commissionId !== null) {
      shared.push({ kind: ScheduleEntryKind.Commission, subjectId: entry.subjectId, commissionId: entry.commissionId })
    } else {
      shared.push({ kind: ScheduleEntryKind.Custom, subjectId: entry.subjectId, label: entry.label, slots: entry.slots })
    }
  }
  return shared
}

export type ImportPlanInput = {
  mode: ScheduleImportMode
  incoming: ReadonlyArray<SharedEntry>
  /** Subjects already in the importing student's timetable. */
  currentSubjectIds: ReadonlySet<number>
  /** Subjects of the importing student's career. */
  careerSubjectIds: ReadonlySet<number>
  /** Commissions that still exist, mapped to their subject. */
  commissionSubjects: ReadonlyMap<number, number>
}

export type ImportPlan = {
  replaceAll: boolean
  toInsert: SharedEntry[]
  skippedExisting: number
  skippedOtherCareer: number
  skippedUnavailable: number
}

/**
 * Decides which shared entries are copied. Merge keeps the student's subjects and adds the rest;
 * replace starts from an empty timetable. Entries of another career or of a deleted commission are skipped.
 */
export function planImport({ mode, incoming, currentSubjectIds, careerSubjectIds, commissionSubjects }: ImportPlanInput): ImportPlan {
  const replaceAll = mode === ScheduleImportMode.Replace
  const plan: ImportPlan = { replaceAll, toInsert: [], skippedExisting: 0, skippedOtherCareer: 0, skippedUnavailable: 0 }
  const taken = new Set<number>(replaceAll ? [] : currentSubjectIds)
  for (const entry of incoming) {
    if (!careerSubjectIds.has(entry.subjectId)) {
      plan.skippedOtherCareer++
      continue
    }
    if (entry.kind === ScheduleEntryKind.Commission && commissionSubjects.get(entry.commissionId) !== entry.subjectId) {
      plan.skippedUnavailable++
      continue
    }
    if (taken.has(entry.subjectId)) {
      plan.skippedExisting++
      continue
    }
    taken.add(entry.subjectId)
    plan.toInsert.push(entry)
  }
  return plan
}

export function describeImport(plan: ImportPlan): string {
  const parts = [`${plan.toInsert.length} ${plan.toInsert.length === 1 ? "materia importada" : "materias importadas"}`]
  if (plan.skippedExisting > 0) parts.push(`${plan.skippedExisting} ya estaban en tu horario`)
  if (plan.skippedOtherCareer > 0) parts.push(`${plan.skippedOtherCareer} de otra carrera`)
  if (plan.skippedUnavailable > 0) parts.push(`${plan.skippedUnavailable} con comisiones que ya no existen`)
  return parts.join(" · ")
}
