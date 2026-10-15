import { describe, expect, it } from "vitest"
import { buildAssistantContext, renderAssistantContext } from "@/lib/assistant/context"
import { canSitSubjectFinal, canTakeSubject, getMissingToSit, getMissingToTake, getSubjectStatus } from "@/lib/assistant/eligibility"
import { buildAssistantSystemPrompt } from "@/lib/assistant/prompt"
import { buildPlanSubjects, type PlanCorrelativeRow, type PlanSubjectRow } from "@/lib/plan-subjects"
import { CorrelativePurpose, CorrelativeType, ExamTable, SubjectStatus } from "@/types/enums"
import type { PlanSubject, UserSubjectStates } from "@/types/types"

function row(id: number, level: number, name: string, examTable: ExamTable | null = ExamTable.MesaI): PlanSubjectRow {
  return { id, careerId: 1, number: id, name, level, hours: 4, isElective: false, isBasicScience: false, examTable }
}

function correlative(subjectId: number, requiredSubjectId: number, purpose: CorrelativePurpose, requirementType: CorrelativeType): PlanCorrelativeRow {
  return { subjectId, requiredSubjectId, purpose, requirementType }
}

// 1 Análisis I and 2 Álgebra have no requirements.
// 3 Análisis II needs 1 regular to take and 1 approved to sit the final.
// 4 Física II needs 1 approved and 2 regular to take, and 1 and 2 approved to sit the final.
const PLAN: PlanSubject[] = buildPlanSubjects(
  [row(1, 1, "Análisis Matemático I"), row(2, 1, "Álgebra"), row(3, 2, "Análisis Matemático II", ExamTable.MesaII), row(4, 2, "Física II", null)],
  [
    correlative(3, 1, CorrelativePurpose.Cursar, CorrelativeType.Regulares),
    correlative(3, 1, CorrelativePurpose.Rendir, CorrelativeType.Aprobadas),
    correlative(4, 1, CorrelativePurpose.Cursar, CorrelativeType.Aprobadas),
    correlative(4, 2, CorrelativePurpose.Cursar, CorrelativeType.Regulares),
    correlative(4, 1, CorrelativePurpose.Rendir, CorrelativeType.Aprobadas),
    correlative(4, 2, CorrelativePurpose.Rendir, CorrelativeType.Aprobadas),
  ],
)

function subject(id: number): PlanSubject {
  const found = PLAN.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`Missing subject ${id}`)
  return found
}

function states(entries: ReadonlyArray<[number, SubjectStatus]>): UserSubjectStates {
  const result: UserSubjectStates = {}
  for (const [id, status] of entries) result[id] = { status, grade: null }
  return result
}

describe("assistant eligibility", () => {
  it("treats subjects without a stored state as not taken", () => {
    expect(getSubjectStatus({}, 1)).toBe(SubjectStatus.NoCursada)
  })

  it("lets a new student take only subjects without correlatives", () => {
    const none = states([])
    expect(PLAN.filter((candidate) => canTakeSubject(candidate, none)).map((candidate) => candidate.id)).toEqual([1, 2])
    expect(getMissingToTake(subject(4), none)).toEqual({ regular: [2], approved: [1] })
  })

  it("accepts a regular subject for a 'regular' requirement but not for an 'approved' one", () => {
    const current = states([
      [1, SubjectStatus.Regular],
      [2, SubjectStatus.Regular],
    ])
    expect(canTakeSubject(subject(3), current)).toBe(true)
    expect(canTakeSubject(subject(4), current)).toBe(false)
    expect(getMissingToTake(subject(4), current)).toEqual({ regular: [], approved: [1] })
  })

  it("never offers a subject the student is already taking or has passed", () => {
    const current = states([
      [1, SubjectStatus.Promocionada],
      [3, SubjectStatus.Cursando],
    ])
    expect(canTakeSubject(subject(1), current)).toBe(false)
    expect(canTakeSubject(subject(3), current)).toBe(false)
  })

  it("allows sitting a final only for regular subjects with the 'para rendir' correlatives approved", () => {
    const blocked = states([
      [1, SubjectStatus.Regular],
      [3, SubjectStatus.Regular],
    ])
    expect(canSitSubjectFinal(subject(3), blocked)).toBe(false)
    expect(getMissingToSit(subject(3), blocked)).toEqual([1])
    expect(canSitSubjectFinal(subject(1), blocked)).toBe(true)

    const ready = states([
      [1, SubjectStatus.Promocionada],
      [3, SubjectStatus.Regular],
    ])
    expect(canSitSubjectFinal(subject(3), ready)).toBe(true)
    expect(canSitSubjectFinal(subject(1), ready)).toBe(false)
  })
})

describe("assistant context", () => {
  const current = states([
    [1, SubjectStatus.Promocionada],
    [2, SubjectStatus.Cursando],
  ])
  const context = buildAssistantContext({ career: { name: "Ingeniería en Sistemas de Información", plan: "2008" }, subjects: PLAN, states: current })

  it("resolves correlatives to subject numbers and computes availability", () => {
    const physics = context.subjects.find((candidate) => candidate.number === 4)
    expect(physics).toMatchObject({
      status: SubjectStatus.NoCursada,
      regularToTake: [2],
      approvedToTake: [1],
      approvedToSit: [1, 2],
      missingRegularToTake: [2],
      missingApprovedToTake: [],
      canTake: false,
      canSitFinal: false,
      examTable: null,
    })
    expect(context.subjects.filter((candidate) => candidate.canTake).map((candidate) => candidate.number)).toEqual([3])
  })

  it("renders the plan, the available subjects and what blocks the rest", () => {
    const text = renderAssistantContext(context)
    expect(text).toContain("Carrera: Ingeniería en Sistemas de Información (plan 2008).")
    expect(text).toContain("- 1. Análisis Matemático I (estado: aprobada; mesa de examen: Mesa I)")
    expect(text).toContain("- 2. Álgebra (estado: cursando; mesa de examen: Mesa I)")
    expect(text).toContain("mesa de examen: sin asignar")
    expect(text).toMatch(/MATERIAS QUE PUEDE CURSAR AHORA[^\n]*\n- 3\. Análisis Matemático II \(nivel 2\)/)
    expect(text).toMatch(/FINALES QUE PUEDE RENDIR AHORA[^\n]*\n- ninguno/)
    expect(text).toContain("- 4. Física II (nivel 2): le falta regularizar [2]")
  })

  it("builds a system prompt that forbids inventing class times and embeds the student data", () => {
    const prompt = buildAssistantSystemPrompt(context)
    expect(prompt).toContain("Nunca inventes horarios")
    expect(prompt).toContain("DATOS DEL ESTUDIANTE")
    expect(prompt).toContain("Análisis Matemático II")
  })
})
