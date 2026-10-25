import { describe, expect, it } from "vitest"
import { buildSeedPlan } from "@/db/seed/plan-data"
import type { AssistantContext } from "@/lib/assistant/context"
import { computeRegularityLossImpact, type ImpactSubject } from "@/lib/assistant/impact"
import { resolveRegularityLossImpact } from "@/lib/assistant/impact-tool"
import { matchSubject, tokenizeSubjectName } from "@/lib/assistant/subject-match"
import { CareerCode, CorrelativePurpose, CorrelativeType, SubjectStatus } from "@/types/enums"

const plan = buildSeedPlan()

function contextOf(code: CareerCode, overrides: Record<string, SubjectStatus> = {}): AssistantContext {
  const subjects = plan.subjects
    .filter((subject) => subject.careerCode === code)
    .map((subject) => {
      const rules = plan.correlatives.filter((rule) => rule.careerCode === code && rule.subjectNumber === subject.number)
      const required = (purpose: CorrelativePurpose, type?: CorrelativeType) =>
        rules.filter((rule) => rule.purpose === purpose && (type === undefined || rule.requirementType === type)).map((rule) => rule.requiredNumber)
      return {
        number: subject.number,
        name: subject.name,
        level: subject.level,
        status: overrides[subject.name] ?? SubjectStatus.NoCursada,
        isElective: subject.isElective,
        examTable: null,
        regularToTake: required(CorrelativePurpose.Cursar, CorrelativeType.Regulares),
        approvedToTake: required(CorrelativePurpose.Cursar, CorrelativeType.Aprobadas),
        approvedToSit: required(CorrelativePurpose.Rendir),
        missingRegularToTake: [],
        missingApprovedToTake: [],
        missingApprovedToSit: [],
        canTake: false,
        canSitFinal: false,
      }
    })
  return { careerName: "Ingeniería en Sistemas de Información", careerPlan: code, subjects, commissionLines: [], timetableLines: [] }
}

const names = (entries: ReadonlyArray<{ name: string }>) => entries.map((entry) => entry.name)

describe("subject name matching", () => {
  const subjects = contextOf(CareerCode.SistemasPlan2008).subjects

  it("normalizes accents, case, plurals, articles and numerals", () => {
    expect(tokenizeSubjectName("Física 1")).toEqual(tokenizeSubjectName("FISICA I"))
    expect(tokenizeSubjectName("Estructuras de Datos")).toEqual(tokenizeSubjectName("estructura datos"))
  })

  it("finds the exact subject", () => {
    expect(matchSubject("diseño de sistemas", subjects)).toMatchObject({ kind: "found", subject: { name: "Diseño de Sistemas" } })
    expect(matchSubject("Ingenieria de software", subjects)).toMatchObject({ kind: "found", subject: { name: "Ingeniería de Software" } })
  })

  it("finds a subject written with a variant", () => {
    expect(matchSubject("estructura de datos", subjects)).toMatchObject({ kind: "found", subject: { name: "Algoritmos y Estructuras de Datos" } })
  })

  it("never picks between several matches", () => {
    const result = matchSubject("inglés", subjects)
    expect(result.kind).toBe("ambiguous")
    if (result.kind === "ambiguous") expect(names(result.candidates)).toEqual(expect.arrayContaining(["Inglés I", "Inglés II"]))
    expect(matchSubject("fisica", subjects).kind).toBe("ambiguous")
  })

  it("does not invent a match", () => {
    expect(matchSubject("cocina molecular", subjects)).toEqual({ kind: "not_found", suggestions: [] })
  })
})

describe("regularity loss impact", () => {
  it("lists what losing Diseño de Sistemas cuts in plan 2008, by level, split by direct and chain", () => {
    const context = contextOf(CareerCode.SistemasPlan2008)
    const result = resolveRegularityLossImpact(context, "Diseño de Sistemas")
    if (result.result !== "found") throw new Error("expected a match")
    const { loses, alreadyRequiredApproval } = result.impact
    expect(names(loses.directToTake)).toEqual(
      expect.arrayContaining(["Ingeniería de Software", "Habilitación Profesional", "Computación en la Nube", "Testing Automatizado de Software"]),
    )
    expect(names(loses.directToTake)).not.toContain("Proyecto Final")
    expect(names(alreadyRequiredApproval)).toContain("Proyecto Final")
    expect(names(loses.laterInChain)).toEqual(expect.arrayContaining(["Agilidad y Gestión de Productos Digitales"]))
    const levels = loses.directToTake.map((entry) => entry.level)
    expect(levels).toEqual([...levels].sort((a, b) => a - b))
    const direct = new Set(names(loses.directToTake))
    expect(names(loses.laterInChain).some((name) => direct.has(name))).toBe(false)
  })

  it("follows the chain from Ingeniería de Software", () => {
    const context = contextOf(CareerCode.SistemasPlan2008)
    const result = resolveRegularityLossImpact(context, "ingenieria de software")
    if (result.result !== "found") throw new Error("expected a match")
    expect(names(result.impact.loses.directToTake)).toEqual(
      expect.arrayContaining(["Agilidad y Gestión de Productos Digitales", "Proyecto Final", "Testing y Calidad de Software"]),
    )
  })

  it("keeps the student's status on every entry and flags the lost final only when regular", () => {
    const regular = contextOf(CareerCode.SistemasPlan2008, { "Diseño de Sistemas": SubjectStatus.Regular, "Ingeniería de Software": SubjectStatus.Cursando })
    const result = resolveRegularityLossImpact(regular, "diseño de sistemas")
    if (result.result !== "found") throw new Error("expected a match")
    expect(result.impact.loses.finalOfSubject).toBe(true)
    expect(result.impact.loses.directToTake.find((entry) => entry.name === "Ingeniería de Software")?.status).toBe(SubjectStatus.Cursando)
    const untouched = resolveRegularityLossImpact(contextOf(CareerCode.SistemasPlan2008), "diseño de sistemas")
    if (untouched.result !== "found") throw new Error("expected a match")
    expect(untouched.impact.loses.finalOfSubject).toBe(false)
  })

  it("works on plan 2023 with its own subject names", () => {
    const context = contextOf(CareerCode.Sistemas)
    const result = resolveRegularityLossImpact(context, "diseño de sistemas")
    if (result.result !== "found") throw new Error("expected a match")
    expect(result.impact.subject.name).toBe("Diseño de Sistemas de Información")
    expect(result.impact.loses.directToTake.length).toBeGreaterThan(0)
  })

  it("asks instead of calculating when the name is ambiguous", () => {
    const result = resolveRegularityLossImpact(contextOf(CareerCode.SistemasPlan2008), "inglés")
    expect(result.result).toBe("ambiguous")
    expect("impact" in result).toBe(false)
  })

  it("reports a subject with no dependents as an empty impact", () => {
    const leaf: ImpactSubject = { number: 9, name: "Hoja", level: 5, status: SubjectStatus.Regular, regularToTake: [], approvedToTake: [], approvedToSit: [] }
    const impact = computeRegularityLossImpact(leaf, [leaf])
    expect(impact.loses.directToTake).toEqual([])
    expect(impact.loses.laterInChain).toEqual([])
  })
})
