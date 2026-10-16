import { SubjectStatus } from "@/types/enums"
import type { UserSubjectState, UserSubjectStates } from "@/types/types"
import { SysacadRowStatus, type SysacadRow } from "./types"

/** How the imported states meet the ones the student already has. */
export enum SysacadImportMode {
  /** Only fills empty subjects and upgrades states (and adds missing grades); never lowers anything. */
  Merge = "merge",
  /** SysAcad wins for every imported subject, even when that lowers a state. */
  Replace = "replace",
}

/** What importing does to one subject. */
export enum SysacadChangeKind {
  /** The subject had no state (or "No cursada"). */
  New = "new",
  /** The state moves forward: cursando → regular → promocionada. */
  Upgrade = "upgrade",
  /** Already promoted without a grade; the grade from SysAcad is added. */
  GradeFill = "grade_fill",
  /** Replace mode: same state with a different grade. */
  GradeChange = "grade_change",
  /** Replace mode: the state moves back. */
  Downgrade = "downgrade",
  /** Nothing to change. */
  Unchanged = "unchanged",
  /** Merge mode: SysAcad says less than the app (or another grade); the student's value is kept. */
  Kept = "kept",
}

/** Kinds that write to the database. */
export const WRITING_CHANGE_KINDS: ReadonlySet<SysacadChangeKind> = new Set([
  SysacadChangeKind.New,
  SysacadChangeKind.Upgrade,
  SysacadChangeKind.GradeFill,
  SysacadChangeKind.GradeChange,
  SysacadChangeKind.Downgrade,
])

const STATUS_RANK: Record<SubjectStatus, number> = {
  [SubjectStatus.NoCursada]: 0,
  [SubjectStatus.Cursando]: 1,
  [SubjectStatus.Regular]: 2,
  [SubjectStatus.Promocionada]: 3,
}

/** State the app should hold for a SysAcad row, or null when the row has nothing to import. */
export function sysacadRowToState(row: SysacadRow): UserSubjectState | null {
  switch (row.status) {
    case SysacadRowStatus.Approved:
      return { status: SubjectStatus.Promocionada, grade: row.grade ?? null }
    case SysacadRowStatus.Regular:
      return { status: SubjectStatus.Regular, grade: null }
    case SysacadRowStatus.Enrolled:
      return { status: SubjectStatus.Cursando, grade: null }
    case SysacadRowStatus.None:
    case SysacadRowStatus.Unknown:
      return null
  }
}

export type SysacadImportItem = { subjectId: number } & UserSubjectState

export type SysacadChange = {
  subjectId: number
  current: UserSubjectState | null
  /** State after the import (equal to `current` when nothing is written). */
  next: UserSubjectState
  kind: SysacadChangeKind
}

function sameState(left: UserSubjectState, right: UserSubjectState): boolean {
  return left.status === right.status && left.grade === right.grade
}

/** When two rows point at the same subject (a manual pick), the most advanced state wins. */
export function dedupeImportItems(items: ReadonlyArray<SysacadImportItem>): SysacadImportItem[] {
  const bySubject = new Map<number, SysacadImportItem>()
  for (const item of items) {
    const existing = bySubject.get(item.subjectId)
    const better =
      !existing ||
      STATUS_RANK[item.status] > STATUS_RANK[existing.status] ||
      (item.status === existing.status && existing.grade === null && item.grade !== null)
    if (better) bySubject.set(item.subjectId, item)
  }
  return [...bySubject.values()]
}

function planOne(item: SysacadImportItem, current: UserSubjectState | null, mode: SysacadImportMode): SysacadChange {
  const imported: UserSubjectState = { status: item.status, grade: item.grade }
  const base = { subjectId: item.subjectId, current }
  if (!current || current.status === SubjectStatus.NoCursada) {
    if (imported.status === SubjectStatus.NoCursada) return { ...base, next: current ?? imported, kind: SysacadChangeKind.Unchanged }
    return { ...base, next: imported, kind: SysacadChangeKind.New }
  }

  const rankDelta = STATUS_RANK[imported.status] - STATUS_RANK[current.status]
  if (rankDelta > 0) return { ...base, next: imported, kind: SysacadChangeKind.Upgrade }

  if (rankDelta === 0) {
    // An approval without a grade ("Aprobada en 2022") never erases a grade the student typed.
    const next: UserSubjectState = { status: current.status, grade: imported.grade ?? current.grade }
    if (sameState(next, current)) return { ...base, next: current, kind: SysacadChangeKind.Unchanged }
    if (current.grade === null) return { ...base, next, kind: SysacadChangeKind.GradeFill }
    if (mode === SysacadImportMode.Replace) return { ...base, next, kind: SysacadChangeKind.GradeChange }
    return { ...base, next: current, kind: SysacadChangeKind.Kept }
  }

  if (mode === SysacadImportMode.Replace) return { ...base, next: imported, kind: SysacadChangeKind.Downgrade }
  return { ...base, next: current, kind: SysacadChangeKind.Kept }
}

/**
 * Computes, per subject, what importing does against the student's current states. Used by the preview and again by
 * the server action against fresh database states, so both always agree.
 */
export function planSysacadImport(
  items: ReadonlyArray<SysacadImportItem>,
  currentStates: UserSubjectStates,
  mode: SysacadImportMode,
): SysacadChange[] {
  return dedupeImportItems(items).map((item) => planOne(item, currentStates[item.subjectId] ?? null, mode))
}

export type SysacadImportSummary = Record<SysacadChangeKind, number>

export function summarizeSysacadChanges(changes: ReadonlyArray<SysacadChange>): SysacadImportSummary {
  const summary: SysacadImportSummary = {
    [SysacadChangeKind.New]: 0,
    [SysacadChangeKind.Upgrade]: 0,
    [SysacadChangeKind.GradeFill]: 0,
    [SysacadChangeKind.GradeChange]: 0,
    [SysacadChangeKind.Downgrade]: 0,
    [SysacadChangeKind.Unchanged]: 0,
    [SysacadChangeKind.Kept]: 0,
  }
  for (const change of changes) summary[change.kind] += 1
  return summary
}

export function countWrites(summary: SysacadImportSummary): number {
  let total = 0
  for (const kind of WRITING_CHANGE_KINDS) total += summary[kind]
  return total
}
