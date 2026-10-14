import { describe, expect, it } from "vitest"
import {
  canSitFinalExam,
  canTakeCourse,
  getAvailableCourses,
  getCorrelatives,
  getEnabledSubjects,
  getMissingRequirements,
  getPrerequisiteSubjects,
  isApproved,
  isRegularOrApproved,
  type CourseStates,
} from "@/lib/correlatives"
import { coursesData2008 } from "@/data/courses-2008"
import type { Course, PlanSubject } from "@/types/types"
import { buildPlanSubjects } from "@/lib/plan-subjects"
import { CorrelativePurpose, CorrelativeType, SubjectStatus } from "@/types/enums"

function course(code: string, level: number, overrides: Partial<Course> = {}): Course {
  return {
    code,
    name: `Course ${code}`,
    level,
    regularesParaCursar: [],
    aprobadasParaCursar: [],
    aprobadasParaRendir: [],
    hours: 4,
    ...overrides,
  }
}

// A: no requirements. B: needs A regular to take, A approved to render. C: needs B regular and A approved to take.
const A = course("A", 1)
const B = course("B", 2, { regularesParaCursar: ["A"], aprobadasParaRendir: ["A"] })
const C = course("C", 3, { regularesParaCursar: ["B"], aprobadasParaCursar: ["A"], aprobadasParaRendir: ["A", "B"] })
const PLAN = [A, B, C]

describe("status predicates", () => {
  it("only a promoted subject counts as approved", () => {
    expect(isApproved(SubjectStatus.Promocionada)).toBe(true)
    expect(isApproved(SubjectStatus.Regular)).toBe(false)
    expect(isApproved(SubjectStatus.Cursando)).toBe(false)
    expect(isApproved(undefined)).toBe(false)
  })

  it("regular or promoted satisfies a regular requirement", () => {
    expect(isRegularOrApproved(SubjectStatus.Regular)).toBe(true)
    expect(isRegularOrApproved(SubjectStatus.Promocionada)).toBe(true)
    expect(isRegularOrApproved(SubjectStatus.Cursando)).toBe(false)
    expect(isRegularOrApproved(SubjectStatus.NoCursada)).toBe(false)
  })
})

describe("getCorrelatives", () => {
  it("returns the list matching purpose and type", () => {
    expect(getCorrelatives(C, CorrelativePurpose.Cursar, CorrelativeType.Regulares)).toEqual(["B"])
    expect(getCorrelatives(C, CorrelativePurpose.Cursar, CorrelativeType.Aprobadas)).toEqual(["A"])
    expect(getCorrelatives(C, CorrelativePurpose.Rendir, CorrelativeType.Regulares)).toEqual(["A", "B"])
    expect(getCorrelatives(C, CorrelativePurpose.Rendir, CorrelativeType.Aprobadas)).toEqual(["A", "B"])
  })
})

describe("canTakeCourse", () => {
  it("allows first-level courses with no history", () => {
    expect(canTakeCourse(A, {})).toBe(true)
  })

  it("requires regular prerequisites", () => {
    expect(canTakeCourse(B, {})).toBe(false)
    expect(canTakeCourse(B, { A: SubjectStatus.Cursando })).toBe(false)
    expect(canTakeCourse(B, { A: SubjectStatus.Regular })).toBe(true)
    expect(canTakeCourse(B, { A: SubjectStatus.Promocionada })).toBe(true)
  })

  it("requires approved prerequisites to be promoted, not just regular", () => {
    const states: CourseStates = { A: SubjectStatus.Regular, B: SubjectStatus.Regular }
    expect(canTakeCourse(C, states)).toBe(false)
    expect(getMissingRequirements(C, states, CorrelativePurpose.Cursar)).toEqual({
      missingRegular: [],
      missingApproved: ["A"],
    })
    expect(canTakeCourse(C, { ...states, A: SubjectStatus.Promocionada })).toBe(true)
  })

  it("does not offer a course that is already in progress, regular or promoted", () => {
    expect(canTakeCourse(A, { A: SubjectStatus.Cursando })).toBe(false)
    expect(canTakeCourse(A, { A: SubjectStatus.Regular })).toBe(false)
    expect(canTakeCourse(A, { A: SubjectStatus.Promocionada })).toBe(false)
    expect(canTakeCourse(A, { A: SubjectStatus.NoCursada })).toBe(true)
  })
})

describe("canSitFinalExam", () => {
  it("requires the course itself to be regular", () => {
    expect(canSitFinalExam(A, {})).toBe(false)
    expect(canSitFinalExam(A, { A: SubjectStatus.Cursando })).toBe(false)
    expect(canSitFinalExam(A, { A: SubjectStatus.Regular })).toBe(true)
    expect(canSitFinalExam(A, { A: SubjectStatus.Promocionada })).toBe(false)
  })

  it("requires every 'para rendir' correlative approved", () => {
    expect(canSitFinalExam(B, { B: SubjectStatus.Regular, A: SubjectStatus.Regular })).toBe(false)
    expect(canSitFinalExam(B, { B: SubjectStatus.Regular, A: SubjectStatus.Promocionada })).toBe(true)
    expect(
      getMissingRequirements(C, { C: SubjectStatus.Regular, A: SubjectStatus.Promocionada }, CorrelativePurpose.Rendir),
    ).toEqual({ missingRegular: [], missingApproved: ["B"] })
  })
})

describe("getAvailableCourses", () => {
  it("lists what a new student can take", () => {
    expect(getAvailableCourses(PLAN, {}, CorrelativePurpose.Cursar).map((c) => c.code)).toEqual(["A"])
  })

  it("unlocks courses as the student progresses", () => {
    const states: CourseStates = { A: SubjectStatus.Promocionada, B: SubjectStatus.Regular }
    expect(getAvailableCourses(PLAN, states, CorrelativePurpose.Cursar).map((c) => c.code)).toEqual(["C"])
    expect(getAvailableCourses(PLAN, states, CorrelativePurpose.Rendir).map((c) => c.code)).toEqual(["B"])
  })

  it("on the real 2008 plan, a new student can take exactly the courses without 'para cursar' correlatives", () => {
    const available = getAvailableCourses(coursesData2008, {}, CorrelativePurpose.Cursar).map((c) => c.code)
    const expected = coursesData2008
      .filter((c) => c.regularesParaCursar.length === 0 && c.aprobadasParaCursar.length === 0)
      .map((c) => c.code)
    expect(available).toEqual(expected)
    expect(available).toContain("1")
    expect(available).not.toContain("11")
  })

  it("on the real 2008 plan, Proyecto Final can only be rendered with every other mandatory course approved", () => {
    const finalProject = coursesData2008.find((c) => c.code === "32")
    expect(finalProject).toBeDefined()
    if (!finalProject) return
    const allApproved: Record<string, SubjectStatus> = {}
    for (const c of coursesData2008) {
      if (!c.isElective && c.code !== "32") allApproved[c.code] = SubjectStatus.Promocionada
    }
    expect(canSitFinalExam(finalProject, { ...allApproved, "32": SubjectStatus.Regular })).toBe(true)
    expect(canSitFinalExam(finalProject, { ...allApproved, "35": SubjectStatus.Regular, "32": SubjectStatus.Regular })).toBe(false)
  })
})

describe("DB subject dependency helpers", () => {
  const row = (id: number, name: string, level: number) => ({
    id,
    careerId: 1,
    number: id,
    name,
    level,
    hours: null,
    isElective: false,
    isBasicScience: false,
    examTable: null,
  })
  const take = (subjectId: number, requiredSubjectId: number, requirementType: CorrelativeType) => ({
    subjectId,
    requiredSubjectId,
    purpose: CorrelativePurpose.Cursar,
    requirementType,
  })
  const all: PlanSubject[] = buildPlanSubjects(
    [row(4, "Métodos", 3), row(3, "Análisis II", 2), row(1, "Análisis I", 1), row(2, "Álgebra", 1)],
    [
      take(3, 1, CorrelativeType.Regulares),
      take(3, 2, CorrelativeType.Regulares),
      take(4, 1, CorrelativeType.Aprobadas),
      take(4, 3, CorrelativeType.Regulares),
    ],
  )
  const byName = (name: string) => {
    const found = all.find((s) => s.name === name)
    if (!found) throw new Error(name)
    return found
  }

  it("finds prerequisites from approve and take lists, sorted by level", () => {
    expect(getPrerequisiteSubjects(byName("Métodos"), all).map((s) => s.name)).toEqual(["Análisis I", "Análisis II"])
    expect(getPrerequisiteSubjects(byName("Análisis II"), all).map((s) => s.name).sort()).toEqual(["Análisis I", "Álgebra"])
    expect(getPrerequisiteSubjects(byName("Álgebra"), all)).toEqual([])
  })

  it("finds the subjects a subject enables", () => {
    expect(getEnabledSubjects(byName("Análisis II"), all).map((s) => s.name)).toEqual(["Métodos"])
    expect(getEnabledSubjects(byName("Métodos"), all)).toEqual([])
  })
})
