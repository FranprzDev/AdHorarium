import { describe, expect, it } from "vitest"
import {
  adminSubjectFiltersSchema,
  correlativeInputSchema,
  createSubjectInputSchema,
  updateSubjectInputSchema,
} from "@/lib/validation/admin"
import { CorrelativePurpose, CorrelativeType, ExamTable } from "@/types/enums"

const validSubject = {
  careerId: 1,
  number: 12,
  name: "  Sistemas Operativos ",
  level: 2,
  hours: 8,
  isElective: false,
  isBasicScience: false,
  examTable: ExamTable.MesaII,
}

describe("admin subject validation", () => {
  it("accepts a valid subject and trims the name", () => {
    expect(createSubjectInputSchema.parse(validSubject).name).toBe("Sistemas Operativos")
  })

  it("accepts subjects without hours or exam table", () => {
    expect(createSubjectInputSchema.safeParse({ ...validSubject, hours: null, examTable: null }).success).toBe(true)
  })

  it.each([
    ["level below range", { level: 0 }],
    ["level above range", { level: 7 }],
    ["fractional level", { level: 1.5 }],
    ["non positive number", { number: 0 }],
    ["NaN number", { number: Number.NaN }],
    ["empty name", { name: "   " }],
    ["zero hours", { hours: 0 }],
    ["unknown exam table", { examTable: "Mesa IV" }],
  ])("rejects %s", (_, override) => {
    expect(createSubjectInputSchema.safeParse({ ...validSubject, ...override }).success).toBe(false)
  })

  it("requires the subject id to update", () => {
    const fields = { ...validSubject, careerId: undefined }
    expect(updateSubjectInputSchema.safeParse(fields).success).toBe(false)
    expect(updateSubjectInputSchema.safeParse({ ...fields, id: 3 }).success).toBe(true)
  })

  it("explains invalid levels in Spanish", () => {
    const result = createSubjectInputSchema.safeParse({ ...validSubject, level: 9 })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0]?.message).toBe("El nivel debe estar entre 1 y 6")
  })
})

describe("admin filters and correlatives validation", () => {
  it("accepts empty filters", () => {
    expect(adminSubjectFiltersSchema.parse({ careerId: null, level: null, search: "  " }).search).toBe("")
  })

  it("rejects an unknown purpose or requirement type", () => {
    const base = { subjectId: 1, requiredSubjectId: 2, purpose: CorrelativePurpose.Cursar, requirementType: CorrelativeType.Regulares }
    expect(correlativeInputSchema.safeParse(base).success).toBe(true)
    expect(correlativeInputSchema.safeParse({ ...base, purpose: "aprobar" }).success).toBe(false)
    expect(correlativeInputSchema.safeParse({ ...base, requirementType: "libres" }).success).toBe(false)
  })
})
