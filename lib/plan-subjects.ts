import type { PlanSubject, UserSubjectStates } from "@/types/types"
import { CorrelativePurpose, CorrelativeType, SubjectStatus, type ExamTable } from "@/types/enums"

export type PlanSubjectRow = {
  id: number
  careerId: number
  number: number
  name: string
  level: number
  hours: number | null
  isElective: boolean
  isBasicScience: boolean
  examTable: ExamTable | null
}

export type PlanCorrelativeRow = {
  subjectId: number
  requiredSubjectId: number
  purpose: CorrelativePurpose
  requirementType: CorrelativeType
}

export function compareByLevelAndNumber(a: Pick<PlanSubject, "level" | "number">, b: Pick<PlanSubject, "level" | "number">): number {
  return a.level - b.level || a.number - b.number
}

export function buildPlanSubjects(
  subjectRows: ReadonlyArray<PlanSubjectRow>,
  correlativeRows: ReadonlyArray<PlanCorrelativeRow>,
): PlanSubject[] {
  const byId = new Map<number, PlanSubject>()
  for (const row of subjectRows) {
    byId.set(row.id, { ...row, regularToTakeIds: [], approvedToTakeIds: [], approvedToSitIds: [], enablesIds: [] })
  }
  for (const correlative of correlativeRows) {
    const subject = byId.get(correlative.subjectId)
    const required = byId.get(correlative.requiredSubjectId)
    if (!subject || !required) continue
    if (correlative.purpose === CorrelativePurpose.Rendir) {
      subject.approvedToSitIds.push(required.id)
      continue
    }
    if (correlative.requirementType === CorrelativeType.Aprobadas) subject.approvedToTakeIds.push(required.id)
    else subject.regularToTakeIds.push(required.id)
    if (!required.enablesIds.includes(subject.id)) required.enablesIds.push(subject.id)
  }
  return [...byId.values()].sort(compareByLevelAndNumber)
}

export function groupByLevel(subjects: ReadonlyArray<PlanSubject>): Map<number, PlanSubject[]> {
  const groups = new Map<number, PlanSubject[]>()
  for (const subject of [...subjects].sort(compareByLevelAndNumber)) {
    const group = groups.get(subject.level)
    if (group) group.push(subject)
    else groups.set(subject.level, [subject])
  }
  return groups
}

export type PlanImpactSubject = PlanSubject & {
  status: SubjectStatus
  regularToTake: number[]
  approvedToTake: number[]
  approvedToSit: number[]
}

export function toImpactSubjects(subjects: ReadonlyArray<PlanSubject>, states: UserSubjectStates): PlanImpactSubject[] {
  return subjects.map((subject) => ({
    ...subject,
    number: subject.id,
    status: states[subject.id]?.status ?? SubjectStatus.NoCursada,
    regularToTake: subject.regularToTakeIds,
    approvedToTake: subject.approvedToTakeIds,
    approvedToSit: subject.approvedToSitIds,
  }))
}
