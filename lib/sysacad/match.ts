import { SysacadRowStatus, type SysacadRow } from "./types"

/** How a SysAcad row was tied to a subject of the student's plan. */
export enum SysacadMatchMethod {
  /** Same name once accents, case and punctuation are ignored. */
  Exact = "exact",
  /** The SysAcad name is the start of exactly one plan name (cut by the column width, or "I" missing). */
  Prefix = "prefix",
  /** Close spelling; shown to the student to double check. */
  Fuzzy = "fuzzy",
  /** Several plan subjects fit; the student has to pick. */
  Ambiguous = "ambiguous",
  /** No plan subject fits (electives, entrance course, another plan). */
  Unmatched = "unmatched",
  /** Entrance course rows (year 0) of the student's plan; they are not part of the plan. */
  EntranceCourse = "entrance_course",
  /** Row of another plan (its "Plan" column differs) tied by the same name to a subject of the selected plan. */
  OtherPlanEquivalent = "other_plan_equivalent",
  /** Row of another plan with no equivalent by name: the student maps it by hand or skips it. */
  OtherPlan = "other_plan",
}

/** Methods whose row comes from a plan other than the selected career's. */
export const OTHER_PLAN_METHODS: ReadonlySet<SysacadMatchMethod> = new Set([SysacadMatchMethod.OtherPlanEquivalent, SysacadMatchMethod.OtherPlan])

export type MatchableSubject = { id: number; name: string; level: number }

export type SysacadRowMatch = {
  /** Position of the row in the payload, stable key for manual choices. */
  index: number
  row: SysacadRow
  method: SysacadMatchMethod
  subjectId: number | null
  /** Plan subjects to offer when the match is ambiguous or fuzzy, best first. */
  candidateIds: number[]
}

/** Shortest name that can match by prefix: avoids "Física" (entrance course) matching "Física I". */
export const MIN_PREFIX_LENGTH = 12
/** Minimum Dice similarity for an automatic fuzzy match. */
export const FUZZY_THRESHOLD = 0.8
/** Minimum similarity to suggest a subject at all. */
export const SUGGESTION_THRESHOLD = 0.55
/** The best fuzzy candidate must beat the second one by this margin to be picked automatically. */
export const FUZZY_MARGIN = 0.05
const MAX_SUGGESTIONS = 3
const ENTRANCE_COURSE_YEAR = 0

/** Lowercase, without accents, punctuation folded to spaces: "Auditoría (El" → "auditoria el". */
export function normalizeSubjectName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function bigrams(value: string): Map<string, number> {
  const grams = new Map<string, number>()
  for (let index = 0; index < value.length - 1; index += 1) {
    const gram = value.slice(index, index + 2)
    grams.set(gram, (grams.get(gram) ?? 0) + 1)
  }
  return grams
}

/** Sørensen–Dice coefficient over character bigrams of two normalized names (0 to 1). */
export function nameSimilarity(left: string, right: string): number {
  if (left === right) return 1
  if (left.length < 2 || right.length < 2) return 0
  const leftGrams = bigrams(left)
  const rightGrams = bigrams(right)
  let shared = 0
  for (const [gram, count] of leftGrams) shared += Math.min(count, rightGrams.get(gram) ?? 0)
  return (2 * shared) / (left.length - 1 + (right.length - 1))
}

type IndexedSubject = MatchableSubject & { key: string }

/** Keeps the candidates at the row's level when that narrows the list down. */
function preferLevel(candidates: IndexedSubject[], year: number): IndexedSubject[] {
  if (candidates.length < 2) return candidates
  const sameLevel = candidates.filter((subject) => subject.level === year)
  return sameLevel.length > 0 ? sameLevel : candidates
}

function resolve(candidates: IndexedSubject[], year: number, method: SysacadMatchMethod): Pick<SysacadRowMatch, "method" | "subjectId" | "candidateIds"> | null {
  if (candidates.length === 0) return null
  const narrowed = preferLevel(candidates, year)
  if (narrowed.length === 1) return { method, subjectId: narrowed[0].id, candidateIds: [] }
  return { method: SysacadMatchMethod.Ambiguous, subjectId: null, candidateIds: narrowed.map((subject) => subject.id) }
}

function matchOne(row: SysacadRow, subjects: IndexedSubject[]): Pick<SysacadRowMatch, "method" | "subjectId" | "candidateIds"> {
  const key = normalizeSubjectName(row.name)

  const exact = resolve(
    subjects.filter((subject) => subject.key === key),
    row.year,
    SysacadMatchMethod.Exact,
  )
  if (exact) return exact

  const prefixed = subjects.filter((subject) => subject.key.startsWith(key))
  if (key.length >= MIN_PREFIX_LENGTH) {
    const prefix = resolve(prefixed, row.year, SysacadMatchMethod.Prefix)
    if (prefix) return prefix
  } else if (prefixed.length > 0) {
    // "Fisica" starts "Física I" and "Física II": too short to guess, the student picks.
    return { method: SysacadMatchMethod.Ambiguous, subjectId: null, candidateIds: prefixed.map((subject) => subject.id) }
  }

  const scored = subjects
    .map((subject) => ({ subject, score: nameSimilarity(key, subject.key) }))
    .filter((entry) => entry.score >= SUGGESTION_THRESHOLD)
    .sort((left, right) => right.score - left.score)
  const suggestions = scored.slice(0, MAX_SUGGESTIONS).map((entry) => entry.subject.id)
  const [best, second] = scored
  if (best && best.score >= FUZZY_THRESHOLD && (!second || best.score - second.score >= FUZZY_MARGIN)) {
    return { method: SysacadMatchMethod.Fuzzy, subjectId: best.subject.id, candidateIds: suggestions }
  }
  if (suggestions.length > 0) return { method: SysacadMatchMethod.Ambiguous, subjectId: null, candidateIds: suggestions }
  return { method: SysacadMatchMethod.Unmatched, subjectId: null, candidateIds: [] }
}

/**
 * Rows of another plan only take an equivalent when the name is the same (or a long cut of it): a fuzzy guess across
 * plans could tie a subject to a different one, so everything else is listed for the student with suggestions.
 */
function matchOtherPlan(row: SysacadRow, subjects: IndexedSubject[]): Pick<SysacadRowMatch, "method" | "subjectId" | "candidateIds"> {
  const sameName = matchOne(row, subjects)
  const isSafe = sameName.subjectId !== null && (sameName.method === SysacadMatchMethod.Exact || sameName.method === SysacadMatchMethod.Prefix)
  if (isSafe) return { method: SysacadMatchMethod.OtherPlanEquivalent, subjectId: sameName.subjectId, candidateIds: [] }
  const suggestions = sameName.subjectId !== null ? [sameName.subjectId, ...sameName.candidateIds.filter((id) => id !== sameName.subjectId)] : sameName.candidateIds
  return { method: SysacadMatchMethod.OtherPlan, subjectId: null, candidateIds: suggestions }
}

/** True when a row's "Plan" column names a plan other than `careerPlan` (rows without a plan count as the same). */
export function isOtherPlanRow(row: SysacadRow, careerPlan: string | null): boolean {
  return careerPlan !== null && row.plan !== "" && row.plan !== careerPlan
}

/**
 * Ties each SysAcad row to a subject of the student's plan (`careerPlan`, e.g. "2023"). Rows of another plan (the
 * entrance course of plan 2008, or a student who changed plans) are matched by equivalent name only, never guessed.
 * Entrance-course rows (year 0) of the same plan are never matched automatically: their names ("Física",
 * "Matemática") would otherwise land on first-year subjects.
 */
export function matchSysacadRows(
  rows: ReadonlyArray<SysacadRow>,
  subjects: ReadonlyArray<MatchableSubject>,
  careerPlan: string | null = null,
): SysacadRowMatch[] {
  const indexed: IndexedSubject[] = subjects.map((subject) => ({ ...subject, key: normalizeSubjectName(subject.name) }))
  return rows.map((row, index) => {
    if (isOtherPlanRow(row, careerPlan)) return { index, row, ...matchOtherPlan(row, indexed) }
    if (row.year === ENTRANCE_COURSE_YEAR) {
      return { index, row, method: SysacadMatchMethod.EntranceCourse, subjectId: null, candidateIds: [] }
    }
    return { index, row, ...matchOne(row, indexed) }
  })
}

/** True when the row carries a state worth importing. */
export function isImportableRow(row: SysacadRow): boolean {
  return row.status !== SysacadRowStatus.None && row.status !== SysacadRowStatus.Unknown
}
