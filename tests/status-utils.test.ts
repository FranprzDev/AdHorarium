import { describe, expect, it } from "vitest"
import { SUBJECT_STATUS_BADGES, SUBJECT_STATUS_COLORS, SUBJECT_STATUS_LABELS, isSubjectStatus } from "@/lib/subject-status"
import { EXAM_TABLES, createEmptyExamTableMap } from "@/lib/exam-tables"
import { getErrorMessage } from "@/lib/errors"
import { BadgeVariant, ExamTable, SubjectStatus } from "@/types/enums"

describe("SubjectStatus contract", () => {
  it("keeps the exact persisted string values", () => {
    expect(Object.values(SubjectStatus).sort()).toEqual(["cursando", "no_cursada", "promocionada", "regular"])
  })

  it("has a label, color and badge for every status", () => {
    for (const status of Object.values(SubjectStatus)) {
      expect(SUBJECT_STATUS_LABELS[status]).toBeTypeOf("string")
      expect(SUBJECT_STATUS_COLORS[status]).toMatch(/^bg-/)
      expect(Object.values(BadgeVariant)).toContain(SUBJECT_STATUS_BADGES[status].variant)
    }
  })

  it("hides the badge label for subjects not taken", () => {
    expect(SUBJECT_STATUS_BADGES[SubjectStatus.NoCursada].label).toBe("")
  })
})

describe("isSubjectStatus", () => {
  it("accepts persisted values", () => {
    expect(isSubjectStatus("promocionada")).toBe(true)
    expect(isSubjectStatus("no_cursada")).toBe(true)
  })

  it("rejects legacy, differently-cased or non-string values", () => {
    expect(isSubjectStatus("PROMOCIONADO")).toBe(false)
    expect(isSubjectStatus("Regular")).toBe(false)
    expect(isSubjectStatus(null)).toBe(false)
    expect(isSubjectStatus(1)).toBe(false)
  })
})

describe("exam tables", () => {
  it("creates an independent empty map with every table", () => {
    const first = createEmptyExamTableMap()
    const second = createEmptyExamTableMap()
    expect(Object.keys(first)).toEqual(EXAM_TABLES)
    first[ExamTable.MesaI].push("Física I")
    expect(second[ExamTable.MesaI]).toEqual([])
  })
})

describe("getErrorMessage", () => {
  it("reads Error instances, message-bearing objects and primitives", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom")
    expect(getErrorMessage({ message: "row not found", code: "PGRST116" })).toBe("row not found")
    expect(getErrorMessage("plain")).toBe("plain")
  })
})
