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
import type { Course, Subject } from "@/types/types"
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
  function subject(name: string, nivel: string, overrides: Partial<Subject> = {}): Subject {
    return {
      career_code: "SIS",
      subject_number: Number(nivel) * 10 + name.length,
      subject_name: name,
      nivel,
      must_approve_names: [],
      must_take_names: [],
      enables_names: [],
      ...overrides,
    }
  }

  const algebra = subject("Álgebra", "1")
  const analisis = subject("Análisis I", "1")
  const analisis2 = subject("Análisis II", "2", { must_take_names: ["Análisis I", "Álgebra"], enables_names: ["Métodos"] })
  const metodos = subject("Métodos", "3", { must_approve_names: ["Análisis I"], must_take_names: ["Análisis II"] })
  const all = [metodos, analisis2, analisis, algebra]

  it("finds prerequisites from approve and take lists, sorted by level", () => {
    expect(getPrerequisiteSubjects(metodos, all).map((s) => s.subject_name)).toEqual(["Análisis I", "Análisis II"])
    expect(getPrerequisiteSubjects(analisis2, all).map((s) => s.subject_name).sort()).toEqual(["Análisis I", "Álgebra"])
    expect(getPrerequisiteSubjects(algebra, all)).toEqual([])
  })

  it("finds the subjects a subject enables", () => {
    expect(getEnabledSubjects(analisis2, all).map((s) => s.subject_name)).toEqual(["Métodos"])
    expect(getEnabledSubjects(metodos, all)).toEqual([])
  })
})
