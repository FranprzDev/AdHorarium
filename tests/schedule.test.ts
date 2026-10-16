import { describe, expect, it } from "vitest"
import { computeGridLayout } from "@/lib/schedule/layout"
import { commissionClashes, findOverlaps, hasInternalOverlap, overlappingSlotKeys, slotKey } from "@/lib/schedule/overlaps"
import { PAGE_HEIGHT_MM, PAGE_WIDTH_MM, drawSchedulePage, wrapText, type SchedulePainter, type TextStyle } from "@/lib/schedule/render"
import { createShareId, describeImport, planImport, toSharedEntries } from "@/lib/schedule/sharing"
import { slotsOverlap, toMinutes } from "@/lib/schedule/time"
import type { ClassSlot, ScheduleEntry, SharedEntry } from "@/lib/schedule/types"
import {
  classSlotSchema,
  commissionFieldsSchema,
  createShareInputSchema,
  importShareInputSchema,
  sharedEntriesSchema,
  shareIdSchema,
} from "@/lib/schedule/validation"
import { ClassDay, CommissionPeriod, CommissionShift, ScheduleEntryKind, ScheduleImportMode } from "@/types/enums"

function slot(day: ClassDay, start: string, end: string, classroom: string | null = null): ClassSlot {
  return { day, start, end, classroom }
}

function entry(id: number, subjectId: number, slots: ClassSlot[], kind = ScheduleEntryKind.Commission): ScheduleEntry {
  return {
    id,
    kind,
    subjectId,
    subjectName: `Materia ${subjectId}`,
    subjectLevel: 1,
    commissionId: kind === ScheduleEntryKind.Commission ? id * 100 : null,
    label: `C${id}`,
    shift: kind === ScheduleEntryKind.Commission ? CommissionShift.Manana : null,
    period: kind === ScheduleEntryKind.Commission ? CommissionPeriod.Anual : null,
    slots,
  }
}

describe("schedule time and overlaps", () => {
  it("converts times and detects overlaps only on the same day with crossing ranges", () => {
    expect(toMinutes("08:30")).toBe(510)
    expect(slotsOverlap(slot(ClassDay.Lunes, "08:00", "10:00"), slot(ClassDay.Lunes, "09:59", "11:00"))).toBe(true)
    expect(slotsOverlap(slot(ClassDay.Lunes, "08:00", "10:00"), slot(ClassDay.Lunes, "10:00", "11:00"))).toBe(false)
    expect(slotsOverlap(slot(ClassDay.Lunes, "08:00", "10:00"), slot(ClassDay.Martes, "08:00", "10:00"))).toBe(false)
    expect(slotsOverlap(slot(ClassDay.Lunes, "08:00", "12:00"), slot(ClassDay.Lunes, "09:00", "10:00"))).toBe(true)
  })

  it("reports every clashing pair of slots between entries", () => {
    const entries = [
      entry(1, 1, [slot(ClassDay.Lunes, "08:00", "10:00"), slot(ClassDay.Jueves, "08:00", "10:00")]),
      entry(2, 2, [slot(ClassDay.Lunes, "09:00", "11:00")]),
      entry(3, 3, [slot(ClassDay.Jueves, "10:00", "12:00")]),
    ]
    const overlaps = findOverlaps(entries)
    expect(overlaps).toEqual([{ firstEntryId: 1, firstSlotIndex: 0, secondEntryId: 2, secondSlotIndex: 0 }])
    expect([...overlappingSlotKeys(overlaps)]).toEqual([slotKey(1, 0), slotKey(2, 0)])
  })

  it("flags commissions that clash with other subjects but not with the subject they would replace", () => {
    const entries = [
      { subjectId: 1, subjectName: "Física", slots: [slot(ClassDay.Lunes, "08:00", "10:00")] },
      { subjectId: 2, subjectName: "Química", slots: [slot(ClassDay.Martes, "08:00", "10:00")] },
    ]
    expect(commissionClashes([slot(ClassDay.Lunes, "09:00", "10:30")], 1, entries)).toEqual([])
    expect(commissionClashes([slot(ClassDay.Martes, "09:00", "10:30"), slot(ClassDay.Lunes, "08:30", "09:00")], 3, entries)).toEqual([
      "Física",
      "Química",
    ])
  })

  it("detects slots of one commission that clash with each other", () => {
    expect(hasInternalOverlap([slot(ClassDay.Lunes, "08:00", "10:00"), slot(ClassDay.Lunes, "09:00", "11:00")])).toBe(true)
    expect(hasInternalOverlap([slot(ClassDay.Lunes, "08:00", "10:00"), slot(ClassDay.Lunes, "10:00", "11:00")])).toBe(false)
  })
})

describe("schedule validation", () => {
  it("accepts a valid commission and normalises an empty classroom to null", () => {
    const parsed = commissionFieldsSchema.parse({
      name: "  1K1 ",
      shift: CommissionShift.Manana,
      period: CommissionPeriod.Anual,
      slots: [{ day: ClassDay.Lunes, start: "08:00", end: "10:15", classroom: "  " }],
    })
    expect(parsed.name).toBe("1K1")
    expect(parsed.slots[0].classroom).toBeNull()
  })

  it("rejects bad times, reversed ranges, unknown enums, empty and self-overlapping slot lists", () => {
    expect(classSlotSchema.safeParse({ day: ClassDay.Lunes, start: "8:00", end: "10:00", classroom: null }).success).toBe(false)
    expect(classSlotSchema.safeParse({ day: ClassDay.Lunes, start: "10:00", end: "10:00", classroom: null }).success).toBe(false)
    expect(classSlotSchema.safeParse({ day: "domingo", start: "08:00", end: "10:00", classroom: null }).success).toBe(false)
    const base = { name: "1K1", shift: CommissionShift.Tarde, period: CommissionPeriod.PrimerCuatrimestre }
    expect(commissionFieldsSchema.safeParse({ ...base, slots: [] }).success).toBe(false)
    expect(commissionFieldsSchema.safeParse({ ...base, shift: "madrugada", slots: [slot(ClassDay.Lunes, "08:00", "09:00")] }).success).toBe(false)
    const overlapping = commissionFieldsSchema.safeParse({
      ...base,
      slots: [slot(ClassDay.Lunes, "08:00", "10:00"), slot(ClassDay.Lunes, "09:00", "11:00")],
    })
    expect(overlapping.success).toBe(false)
  })

  it("validates share ids, display names and import modes", () => {
    const id = createShareId()
    expect(shareIdSchema.safeParse(id).success).toBe(true)
    expect(createShareId()).not.toBe(id)
    expect(shareIdSchema.safeParse("../../etc/passwd").success).toBe(false)
    expect(createShareInputSchema.parse({ displayName: "  " }).displayName).toBeNull()
    expect(importShareInputSchema.safeParse({ shareId: id, mode: "overwrite" }).success).toBe(false)
  })
})

describe("schedule sharing", () => {
  const timetable = [
    entry(1, 10, [slot(ClassDay.Lunes, "08:00", "10:00")]),
    entry(2, 11, [slot(ClassDay.Martes, "08:00", "10:00", "Lab 1")], ScheduleEntryKind.Custom),
  ]

  it("stores catalog commissions by reference and copies custom entries, without personal data", () => {
    const shared = toSharedEntries(timetable)
    expect(shared).toEqual([
      { kind: ScheduleEntryKind.Commission, subjectId: 10, commissionId: 100 },
      { kind: ScheduleEntryKind.Custom, subjectId: 11, label: "C2", slots: [slot(ClassDay.Martes, "08:00", "10:00", "Lab 1")] },
    ])
    expect(sharedEntriesSchema.parse(JSON.parse(JSON.stringify(shared)))).toEqual(shared)
  })

  const incoming: SharedEntry[] = [
    { kind: ScheduleEntryKind.Commission, subjectId: 10, commissionId: 100 },
    { kind: ScheduleEntryKind.Custom, subjectId: 11, label: "2K1", slots: [slot(ClassDay.Martes, "08:00", "10:00")] },
    { kind: ScheduleEntryKind.Commission, subjectId: 12, commissionId: 300 },
    { kind: ScheduleEntryKind.Commission, subjectId: 99, commissionId: 900 },
  ]
  const careerSubjectIds = new Set([10, 11, 12])
  const commissionSubjects = new Map([
    [100, 10],
    [900, 99],
  ])

  it("merge keeps the student's subjects and skips other careers and deleted commissions", () => {
    const plan = planImport({ mode: ScheduleImportMode.Merge, incoming, currentSubjectIds: new Set([11]), careerSubjectIds, commissionSubjects })
    expect(plan.replaceAll).toBe(false)
    expect(plan.toInsert).toEqual([incoming[0]])
    expect(plan).toMatchObject({ skippedExisting: 1, skippedOtherCareer: 1, skippedUnavailable: 1 })
    expect(describeImport(plan)).toBe("1 materia importada · 1 ya estaban en tu horario · 1 de otra carrera · 1 con comisiones que ya no existen")
  })

  it("replace ignores the current timetable", () => {
    const plan = planImport({ mode: ScheduleImportMode.Replace, incoming, currentSubjectIds: new Set([11]), careerSubjectIds, commissionSubjects })
    expect(plan.replaceAll).toBe(true)
    expect(plan.toInsert).toEqual([incoming[0], incoming[1]])
    expect(plan.skippedExisting).toBe(0)
  })

  it("never imports a commission whose id now belongs to another subject", () => {
    const plan = planImport({
      mode: ScheduleImportMode.Merge,
      incoming: [{ kind: ScheduleEntryKind.Commission, subjectId: 10, commissionId: 100 }],
      currentSubjectIds: new Set(),
      careerSubjectIds,
      commissionSubjects: new Map([[100, 12]]),
    })
    expect(plan.toInsert).toEqual([])
    expect(plan.skippedUnavailable).toBe(1)
  })
})

describe("schedule layout and rendering", () => {
  it("spans whole hours, hides Saturday unless used and places clashing blocks side by side", () => {
    const layout = computeGridLayout([
      entry(1, 1, [slot(ClassDay.Lunes, "08:30", "10:00")]),
      entry(2, 2, [slot(ClassDay.Lunes, "09:00", "11:15")]),
      entry(3, 3, [slot(ClassDay.Lunes, "11:15", "12:00")]),
    ])
    expect(layout.days).toEqual([ClassDay.Lunes, ClassDay.Martes, ClassDay.Miercoles, ClassDay.Jueves, ClassDay.Viernes])
    expect(layout.startMinutes).toBe(8 * 60)
    expect(layout.endMinutes).toBe(13 * 60)
    expect(layout.overlapCount).toBe(1)
    const [first, second, third] = layout.blocks
    expect([first.column, first.columns, first.isOverlapping]).toEqual([0, 2, true])
    expect([second.column, second.columns, second.isOverlapping]).toEqual([1, 2, true])
    expect([third.column, third.columns, third.isOverlapping]).toEqual([0, 1, false])
    expect(computeGridLayout([entry(1, 1, [slot(ClassDay.Sabado, "09:00", "12:00")])]).days).toContain(ClassDay.Sabado)
  })

  const fakePainter = () => {
    const texts: string[] = []
    let rects = 0
    const painter: SchedulePainter = {
      rect: () => {
        rects++
      },
      line: () => undefined,
      polyline: () => undefined,
      text: (value) => {
        texts.push(value)
      },
      textWidth: (value: string, style: TextStyle) => value.length * style.size * 0.18,
    }
    return { painter, texts, count: () => rects }
  }

  it("wraps text to the available width and ellipsises what does not fit", () => {
    const { painter } = fakePainter()
    const style = { size: 10, color: "#000" }
    expect(wrapText(painter, "Sintaxis y Semántica de los Lenguajes", style, 24, 3)).toEqual(["Sintaxis y", "Semántica de", "los Lenguajes"])
    const truncated = wrapText(painter, "Sintaxis y Semántica de los Lenguajes", style, 24, 1)
    expect(truncated).toHaveLength(1)
    expect(truncated[0].endsWith("...")).toBe(true)
  })

  it("draws the brand header, every block and the legend on an A4 landscape page", () => {
    const { painter, texts, count } = fakePainter()
    drawSchedulePage(painter, [entry(1, 1, [slot(ClassDay.Lunes, "08:00", "10:00")]), entry(2, 2, [slot(ClassDay.Lunes, "09:00", "11:00")])], {
      studentName: "Estudiante Demo",
      careerName: "Ingeniería en Sistemas de Información",
      generatedAt: new Date(2026, 9, 15),
      siteLabel: "adhorarium.vercel.app",
    })
    expect(PAGE_WIDTH_MM).toBeGreaterThan(PAGE_HEIGHT_MM)
    expect(texts).toContain("AdHorarium")
    expect(texts).toContain("Horario de cursado")
    expect(texts).toContain("Estudiante Demo · Ingeniería en Sistemas de Información")
    expect(texts).toContain("Generado el 15/10/2026 · 1 superposición")
    expect(texts.filter((text) => text === "Superposición")).toHaveLength(2)
    expect(texts).toContain("Generado con AdHorarium · adhorarium.vercel.app")
    expect(count()).toBeGreaterThan(10)
  })
})
