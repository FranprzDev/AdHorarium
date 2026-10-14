import { findCycle, findForwardLevelReferences, type PlanNode } from "@/lib/plan-integrity"
import { CorrelativePurpose, CorrelativeType } from "@/types/enums"

/** Subject fields the plan rules need. */
export type RuleSubject = {
  id: number
  careerId: number
  level: number
  name: string
}

/** One stored correlative edge: `subjectId` requires `requiredSubjectId`. */
export type RuleCorrelative = {
  subjectId: number
  requiredSubjectId: number
  purpose: CorrelativePurpose
  requirementType: CorrelativeType
}

/** Reasons a correlative cannot be added. */
export enum CorrelativeViolation {
  SelfReference = "self_reference",
  OtherCareer = "other_career",
  HigherLevel = "higher_level",
  Duplicate = "duplicate",
  Cycle = "cycle",
  InvalidRequirementForExam = "invalid_requirement_for_exam",
}

export const CORRELATIVE_VIOLATION_MESSAGES: Record<CorrelativeViolation, string> = {
  [CorrelativeViolation.SelfReference]: "Una materia no puede ser correlativa de sí misma",
  [CorrelativeViolation.OtherCareer]: "La correlativa debe pertenecer a la misma carrera",
  [CorrelativeViolation.HigherLevel]: "La correlativa no puede ser de un nivel superior al de la materia",
  [CorrelativeViolation.Duplicate]: "Esa correlativa ya existe para ese propósito",
  [CorrelativeViolation.Cycle]: "La correlativa generaría un ciclo en el plan",
  [CorrelativeViolation.InvalidRequirementForExam]: "Para rendir solo se pueden exigir materias aprobadas",
}

function toNodes(subjects: ReadonlyArray<RuleSubject>, correlatives: ReadonlyArray<RuleCorrelative>): PlanNode[] {
  const requires = new Map<number, Set<string>>()
  for (const correlative of correlatives) {
    const set = requires.get(correlative.subjectId) ?? new Set<string>()
    set.add(String(correlative.requiredSubjectId))
    requires.set(correlative.subjectId, set)
  }
  return subjects.map((subject) => ({
    code: String(subject.id),
    name: subject.name,
    level: subject.level,
    requires: [...(requires.get(subject.id) ?? [])],
  }))
}

/**
 * First rule a new correlative breaks, or null when it can be stored.
 * `careerSubjects` and `careerCorrelatives` describe the whole career plan as currently stored.
 */
export function findCorrelativeViolation(
  candidate: RuleCorrelative,
  careerSubjects: ReadonlyArray<RuleSubject>,
  careerCorrelatives: ReadonlyArray<RuleCorrelative>,
): CorrelativeViolation | null {
  if (candidate.subjectId === candidate.requiredSubjectId) return CorrelativeViolation.SelfReference
  if (candidate.purpose === CorrelativePurpose.Rendir && candidate.requirementType !== CorrelativeType.Aprobadas) {
    return CorrelativeViolation.InvalidRequirementForExam
  }
  const byId = new Map(careerSubjects.map((subject) => [subject.id, subject]))
  const subject = byId.get(candidate.subjectId)
  const required = byId.get(candidate.requiredSubjectId)
  if (!subject || !required || subject.careerId !== required.careerId) return CorrelativeViolation.OtherCareer
  if (required.level > subject.level) return CorrelativeViolation.HigherLevel
  const isDuplicate = careerCorrelatives.some(
    (existing) =>
      existing.subjectId === candidate.subjectId &&
      existing.requiredSubjectId === candidate.requiredSubjectId &&
      existing.purpose === candidate.purpose,
  )
  if (isDuplicate) return CorrelativeViolation.Duplicate
  if (findCycle(toNodes(careerSubjects, [...careerCorrelatives, candidate]))) return CorrelativeViolation.Cycle
  return null
}

/** A correlative that a level change would turn into a higher-level requirement. */
export type LevelConflict = {
  subjectId: number
  requiredSubjectId: number
}

/** Correlatives that would require a higher-level subject if `subjectId` moved to `newLevel`. */
export function findLevelChangeConflicts(
  subjectId: number,
  newLevel: number,
  careerSubjects: ReadonlyArray<RuleSubject>,
  careerCorrelatives: ReadonlyArray<RuleCorrelative>,
): LevelConflict[] {
  const moved = careerSubjects.map((subject) => (subject.id === subjectId ? { ...subject, level: newLevel } : subject))
  const touching = careerCorrelatives.filter(
    (correlative) => correlative.subjectId === subjectId || correlative.requiredSubjectId === subjectId,
  )
  return findForwardLevelReferences(toNodes(moved, touching)).map((reference) => ({
    subjectId: Number(reference.code),
    requiredSubjectId: Number(reference.missing),
  }))
}
