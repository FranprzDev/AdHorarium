import { describe, expect, it } from "vitest"
import { buildSeedPlan } from "@/db/seed/plan-data"
import { findRegularityLossSubjects, type ImpactSubject } from "@/lib/impact"
import { buildPlanSubjects, toImpactSubjects } from "@/lib/plan-subjects"
import { CareerCode, CorrelativePurpose, CorrelativeType, SubjectStatus } from "@/types/enums"

const plan = buildSeedPlan()

function planSubjects(code: CareerCode): ImpactSubject[] {
  const subjectRows = plan.subjects
    .filter((subject) => subject.careerCode === code)
    .map((subject) => ({ ...subject, id: subject.number, careerId: 1 }))
  const correlativeRows = plan.correlatives
    .filter((rule) => rule.careerCode === code)
    .map((rule) => ({ subjectId: rule.subjectNumber, requiredSubjectId: rule.requiredNumber, purpose: rule.purpose, requirementType: rule.requirementType }))
  return toImpactSubjects(buildPlanSubjects(subjectRows, correlativeRows), {})
}

const names = (subjects: ReadonlyArray<{ name: string }>) => subjects.map((subject) => subject.name)

function subjectNamed(subjects: ReadonlyArray<ImpactSubject>, name: string): ImpactSubject {
  const subject = subjects.find((item) => item.name === name)
  if (!subject) throw new Error(`Missing subject ${name}`)
  return subject
}

describe("regularity loss impact", () => {
  it("lists what losing Diseño de Sistemas cuts in plan 2008, by level, split by direct and chain", () => {
    const subjects = planSubjects(CareerCode.SistemasPlan2008)
    const impact = findRegularityLossSubjects(subjectNamed(subjects, "Diseño de Sistemas"), subjects)
    expect(names(impact.direct)).toEqual(
      expect.arrayContaining(["Ingeniería de Software", "Habilitación Profesional", "Computación en la Nube", "Testing Automatizado de Software"]),
    )
    expect(names(impact.direct)).not.toContain("Proyecto Final")
    expect(names(impact.laterInChain)).not.toContain("Proyecto Final")
    expect(names(impact.alreadyRequiredApproval)).toEqual(expect.arrayContaining(["Proyecto Final"]))
    const affected = new Set([...names(impact.direct), ...names(impact.laterInChain)])
    expect(names(impact.alreadyRequiredApproval).some((name) => affected.has(name))).toBe(false)
    expect(names(impact.laterInChain)).toContain("Agilidad y Gestión de Productos Digitales")
    const levels = impact.direct.map((subject) => subject.level)
    expect(levels).toEqual([...levels].sort((a, b) => a - b))
    const direct = new Set(names(impact.direct))
    expect(names(impact.laterInChain).some((name) => direct.has(name))).toBe(false)
    expect(names(impact.finalsNeedingApproval)).toContain("Ingeniería de Software")
  })

  it("follows the chain from Ingeniería de Software", () => {
    const subjects = planSubjects(CareerCode.SistemasPlan2008)
    const impact = findRegularityLossSubjects(subjectNamed(subjects, "Ingeniería de Software"), subjects)
    expect(names(impact.direct)).toEqual(expect.arrayContaining(["Agilidad y Gestión de Productos Digitales", "Proyecto Final", "Testing y Calidad de Software"]))
    expect(impact.laterInChain).toEqual([])
  })

  it("works on plan 2023 with its own subject names", () => {
    const subjects = planSubjects(CareerCode.Sistemas)
    const impact = findRegularityLossSubjects(subjectNamed(subjects, "Diseño de Sistemas de Información"), subjects)
    expect(impact.direct.length).toBeGreaterThan(0)
  })

  it("never includes the subject itself and returns nothing for a subject nobody needs", () => {
    const leaf: ImpactSubject = { number: 9, name: "Hoja", level: 5, status: SubjectStatus.Regular, regularToTake: [], approvedToTake: [], approvedToSit: [] }
    const impact = findRegularityLossSubjects(leaf, [leaf])
    expect(impact).toEqual({ direct: [], laterInChain: [], alreadyRequiredApproval: [], finalsNeedingApproval: [] })
  })

  it("carries the student's status from the saved states", () => {
    const rows = [
      { id: 1, careerId: 1, number: 1, name: "A", level: 1, hours: null, isElective: false, isBasicScience: false, examTable: null },
      { id: 2, careerId: 1, number: 2, name: "B", level: 2, hours: null, isElective: false, isBasicScience: false, examTable: null },
    ]
    const correlatives = [{ subjectId: 2, requiredSubjectId: 1, purpose: CorrelativePurpose.Cursar, requirementType: CorrelativeType.Regulares }]
    const subjects = toImpactSubjects(buildPlanSubjects(rows, correlatives), { 2: { status: SubjectStatus.Cursando, grade: null } })
    const impact = findRegularityLossSubjects(subjectNamed(subjects, "A"), subjects)
    expect(impact.direct.map((subject) => [subject.name, subject.status])).toEqual([["B", SubjectStatus.Cursando]])
  })
})
