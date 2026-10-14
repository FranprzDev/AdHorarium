import { describe, expect, it } from "vitest"
import { careerIdInputSchema, updateSubjectStateInputSchema } from "@/lib/validation/student"
import { SubjectStatus } from "@/types/enums"

describe("student action input schemas", () => {
  it("accepts a promoted subject with a grade between 1 and 10", () => {
    const input = { subjectId: 3, status: SubjectStatus.Promocionada, grade: 8.5 }
    expect(updateSubjectStateInputSchema.parse(input)).toEqual(input)
  })

  it("accepts any status without a grade", () => {
    for (const status of Object.values(SubjectStatus)) {
      expect(updateSubjectStateInputSchema.safeParse({ subjectId: 1, status, grade: null }).success).toBe(true)
    }
  })

  it("rejects a grade on a subject that is not promoted", () => {
    const result = updateSubjectStateInputSchema.safeParse({ subjectId: 1, status: SubjectStatus.Regular, grade: 7 })
    expect(result.success).toBe(false)
  })

  it("rejects grades out of range, unknown statuses and invalid ids", () => {
    expect(updateSubjectStateInputSchema.safeParse({ subjectId: 1, status: SubjectStatus.Promocionada, grade: 11 }).success).toBe(false)
    expect(updateSubjectStateInputSchema.safeParse({ subjectId: 1, status: SubjectStatus.Promocionada, grade: 0 }).success).toBe(false)
    expect(updateSubjectStateInputSchema.safeParse({ subjectId: 1, status: "aprobada", grade: null }).success).toBe(false)
    expect(updateSubjectStateInputSchema.safeParse({ subjectId: -1, status: SubjectStatus.Regular, grade: null }).success).toBe(false)
    expect(careerIdInputSchema.safeParse({ careerId: 1.5 }).success).toBe(false)
    expect(careerIdInputSchema.safeParse({ careerId: 2 }).success).toBe(true)
  })
})
