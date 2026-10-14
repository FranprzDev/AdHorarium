import { describe, expect, it } from "vitest"
import {
  CorrelativeViolation,
  findCorrelativeViolation,
  findLevelChangeConflicts,
  type RuleCorrelative,
  type RuleSubject,
} from "@/lib/admin/correlative-rules"
import { CorrelativePurpose, CorrelativeType } from "@/types/enums"

const CAREER = 1
const OTHER_CAREER = 2

const subjects: RuleSubject[] = [
  { id: 1, careerId: CAREER, level: 1, name: "Análisis I" },
  { id: 2, careerId: CAREER, level: 2, name: "Análisis II" },
  { id: 3, careerId: CAREER, level: 3, name: "Cálculo Numérico" },
  { id: 4, careerId: CAREER, level: 3, name: "Probabilidad" },
  { id: 9, careerId: OTHER_CAREER, level: 1, name: "Química" },
]

const correlatives: RuleCorrelative[] = [
  { subjectId: 2, requiredSubjectId: 1, purpose: CorrelativePurpose.Cursar, requirementType: CorrelativeType.Regulares },
  { subjectId: 3, requiredSubjectId: 2, purpose: CorrelativePurpose.Cursar, requirementType: CorrelativeType.Regulares },
]

function candidate(subjectId: number, requiredSubjectId: number, overrides: Partial<RuleCorrelative> = {}): RuleCorrelative {
  return { subjectId, requiredSubjectId, purpose: CorrelativePurpose.Cursar, requirementType: CorrelativeType.Aprobadas, ...overrides }
}

describe("findCorrelativeViolation", () => {
  it("accepts a valid correlative within the same career and a lower level", () => {
    expect(findCorrelativeViolation(candidate(3, 1), subjects, correlatives)).toBeNull()
  })

  it("accepts a correlative between subjects of the same level", () => {
    expect(findCorrelativeViolation(candidate(4, 3), subjects, correlatives)).toBeNull()
  })

  it("rejects self references", () => {
    expect(findCorrelativeViolation(candidate(2, 2), subjects, correlatives)).toBe(CorrelativeViolation.SelfReference)
  })

  it("rejects subjects from another career", () => {
    expect(findCorrelativeViolation(candidate(2, 9), subjects, correlatives)).toBe(CorrelativeViolation.OtherCareer)
  })

  it("rejects unknown subjects as outside the career", () => {
    expect(findCorrelativeViolation(candidate(2, 99), subjects, correlatives)).toBe(CorrelativeViolation.OtherCareer)
  })

  it("rejects a required subject from a higher level", () => {
    expect(findCorrelativeViolation(candidate(1, 2), subjects, correlatives)).toBe(CorrelativeViolation.HigherLevel)
  })

  it("rejects duplicates for the same purpose even with another requirement type", () => {
    expect(findCorrelativeViolation(candidate(2, 1), subjects, correlatives)).toBe(CorrelativeViolation.Duplicate)
  })

  it("allows the same pair for a different purpose", () => {
    expect(findCorrelativeViolation(candidate(2, 1, { purpose: CorrelativePurpose.Rendir }), subjects, correlatives)).toBeNull()
  })

  it("rejects cycles between same-level subjects", () => {
    const withEdge = [...correlatives, candidate(4, 3)]
    expect(findCorrelativeViolation(candidate(3, 4), subjects, withEdge)).toBe(CorrelativeViolation.Cycle)
  })

  it("rejects cycles that go through another purpose", () => {
    const withEdge = [...correlatives, candidate(4, 3, { purpose: CorrelativePurpose.Rendir })]
    expect(findCorrelativeViolation(candidate(3, 4), subjects, withEdge)).toBe(CorrelativeViolation.Cycle)
  })

  it("rejects regular requirements to sit the final exam", () => {
    const input = candidate(3, 1, { purpose: CorrelativePurpose.Rendir, requirementType: CorrelativeType.Regulares })
    expect(findCorrelativeViolation(input, subjects, correlatives)).toBe(CorrelativeViolation.InvalidRequirementForExam)
  })
})

describe("findLevelChangeConflicts", () => {
  it("allows moving a subject when its correlatives keep pointing down or sideways", () => {
    expect(findLevelChangeConflicts(3, 2, subjects, correlatives)).toEqual([])
    expect(findLevelChangeConflicts(1, 2, subjects, correlatives)).toEqual([])
  })

  it("reports subjects that would require a higher level when a requirement moves up", () => {
    expect(findLevelChangeConflicts(1, 3, subjects, correlatives)).toEqual([{ subjectId: 2, requiredSubjectId: 1 }])
  })

  it("reports requirements above the new level when a subject moves down", () => {
    expect(findLevelChangeConflicts(3, 1, subjects, correlatives)).toEqual([{ subjectId: 3, requiredSubjectId: 2 }])
  })

  it("ignores pre-existing conflicts that do not involve the moved subject", () => {
    const broken = [...correlatives, candidate(1, 4)]
    expect(findLevelChangeConflicts(3, 3, subjects, broken)).toEqual([])
  })
})
