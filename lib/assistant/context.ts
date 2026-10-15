import {
  canSitSubjectFinal,
  canTakeSubject,
  getMissingToSit,
  getMissingToTake,
  getSubjectStatus,
} from "@/lib/assistant/eligibility"
import { compareByLevelAndNumber } from "@/lib/plan-subjects"
import { SubjectStatus, type ExamTable } from "@/types/enums"
import type { Career, PlanSubject, UserSubjectStates } from "@/types/types"

/** Wording of each status inside the assistant prompt (more explicit than the UI badges). */
export const ASSISTANT_STATUS_LABELS: Record<SubjectStatus, string> = {
  [SubjectStatus.NoCursada]: "no cursada",
  [SubjectStatus.Cursando]: "cursando",
  [SubjectStatus.Regular]: "regular (cursado aprobado, falta el final)",
  [SubjectStatus.Promocionada]: "aprobada",
}

/** A subject as the assistant sees it, with correlatives resolved to subject numbers. */
export type AssistantSubject = {
  number: number
  name: string
  level: number
  status: SubjectStatus
  isElective: boolean
  examTable: ExamTable | null
  regularToTake: number[]
  approvedToTake: number[]
  approvedToSit: number[]
  missingRegularToTake: number[]
  missingApprovedToTake: number[]
  missingApprovedToSit: number[]
  canTake: boolean
  canSitFinal: boolean
}

/** Everything the assistant knows about the student, built server side from the database. */
export type AssistantContext = {
  careerName: string
  careerPlan: string
  subjects: AssistantSubject[]
}

export type AssistantContextInput = {
  career: Pick<Career, "name" | "plan">
  subjects: ReadonlyArray<PlanSubject>
  states: UserSubjectStates
}

function toNumbers(ids: ReadonlyArray<number>, numberById: ReadonlyMap<number, number>): number[] {
  const numbers: number[] = []
  for (const id of ids) {
    const subjectNumber = numberById.get(id)
    if (subjectNumber !== undefined) numbers.push(subjectNumber)
  }
  return numbers.sort((a, b) => a - b)
}

export function buildAssistantContext({ career, subjects, states }: AssistantContextInput): AssistantContext {
  const numberById = new Map<number, number>()
  for (const subject of subjects) numberById.set(subject.id, subject.number)

  const assistantSubjects: AssistantSubject[] = []
  for (const subject of [...subjects].sort(compareByLevelAndNumber)) {
    const missingToTake = getMissingToTake(subject, states)
    assistantSubjects.push({
      number: subject.number,
      name: subject.name,
      level: subject.level,
      status: getSubjectStatus(states, subject.id),
      isElective: subject.isElective,
      examTable: subject.examTable,
      regularToTake: toNumbers(subject.regularToTakeIds, numberById),
      approvedToTake: toNumbers(subject.approvedToTakeIds, numberById),
      approvedToSit: toNumbers(subject.approvedToSitIds, numberById),
      missingRegularToTake: toNumbers(missingToTake.regular, numberById),
      missingApprovedToTake: toNumbers(missingToTake.approved, numberById),
      missingApprovedToSit: toNumbers(getMissingToSit(subject, states), numberById),
      canTake: canTakeSubject(subject, states),
      canSitFinal: canSitSubjectFinal(subject, states),
    })
  }
  return { careerName: career.name, careerPlan: career.plan, subjects: assistantSubjects }
}

function formatNumbers(numbers: ReadonlyArray<number>): string {
  return numbers.length === 0 ? "ninguna" : numbers.join(", ")
}

function formatSubjectLine(subject: AssistantSubject): string {
  const tags = [`estado: ${ASSISTANT_STATUS_LABELS[subject.status]}`]
  if (subject.isElective) tags.push("electiva")
  tags.push(subject.examTable ? `mesa de examen: ${subject.examTable}` : "mesa de examen: sin asignar")
  const correlatives =
    `para cursar necesita regulares [${formatNumbers(subject.regularToTake)}] y aprobadas [${formatNumbers(subject.approvedToTake)}]; ` +
    `para rendir el final necesita aprobadas [${formatNumbers(subject.approvedToSit)}]`
  return `- ${subject.number}. ${subject.name} (${tags.join("; ")}). Correlativas: ${correlatives}.`
}

function formatAvailability(subject: AssistantSubject): string {
  return `- ${subject.number}. ${subject.name} (nivel ${subject.level})`
}

function formatBlocked(subject: AssistantSubject): string {
  const missing: string[] = []
  if (subject.missingRegularToTake.length > 0) missing.push(`regularizar [${subject.missingRegularToTake.join(", ")}]`)
  if (subject.missingApprovedToTake.length > 0) missing.push(`aprobar [${subject.missingApprovedToTake.join(", ")}]`)
  return `- ${subject.number}. ${subject.name} (nivel ${subject.level}): le falta ${missing.join(" y ")}`
}

/** Plain text rendering of the context, meant to be embedded in the system prompt. */
export function renderAssistantContext(context: AssistantContext): string {
  const lines: string[] = [`Carrera: ${context.careerName} (plan ${context.careerPlan}).`, ""]

  const levels = [...new Set(context.subjects.map((subject) => subject.level))].sort((a, b) => a - b)
  lines.push("PLAN DE ESTUDIOS (número. nombre, estado del estudiante y correlativas por número de materia):")
  for (const level of levels) {
    lines.push(`Nivel ${level}:`)
    for (const subject of context.subjects) {
      if (subject.level === level) lines.push(formatSubjectLine(subject))
    }
  }

  const canTake = context.subjects.filter((subject) => subject.canTake)
  lines.push("", "MATERIAS QUE PUEDE CURSAR AHORA (calculado por el sistema según sus correlativas):")
  lines.push(...(canTake.length > 0 ? canTake.map(formatAvailability) : ["- ninguna"]))

  const canSit = context.subjects.filter((subject) => subject.canSitFinal)
  lines.push("", "FINALES QUE PUEDE RENDIR AHORA (materias regulares con las correlativas para rendir aprobadas):")
  lines.push(...(canSit.length > 0 ? canSit.map(formatAvailability) : ["- ninguno"]))

  const blocked = context.subjects.filter((subject) => subject.status === SubjectStatus.NoCursada && !subject.canTake)
  lines.push("", "MATERIAS NO CURSADAS QUE TODAVÍA NO PUEDE CURSAR (y qué le falta):")
  lines.push(...(blocked.length > 0 ? blocked.map(formatBlocked) : ["- ninguna"]))

  return lines.join("\n")
}
