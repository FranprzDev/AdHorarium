import { describe, expect, it } from "vitest"
import {
  buildCommissionImportPlan,
  CommissionImportError,
  IMPORT_COLUMNS,
  normalizeSubjectName,
  parseCsvRecords,
  type CatalogCommission,
  type CatalogSubject,
} from "@/lib/schedule/commission-import"
import { ClassDay, CommissionImportFormat, CommissionImportStatus, CommissionPeriod, CommissionShift, ImportIssueLevel } from "@/types/enums"

const SOURCE = "Departamento de Sistemas UTN-FRT"
const TERM = "2.º cuatrimestre 2026"
const URL = "https://sistemasfrtutn.ar/horarios/"

const subjects: CatalogSubject[] = [
  { id: 101, careerCode: "ISI", plan: "2023", number: 9, name: "Análisis Matemático II" },
  { id: 102, careerCode: "ISI", plan: "2023", number: 13, name: "Física II" },
  { id: 201, careerCode: "IC", plan: "2023", number: 9, name: "Topografía" },
]

const emptyCatalog = { subjects, commissions: [] }

function csv(rows: ReadonlyArray<ReadonlyArray<string>>): string {
  return [IMPORT_COLUMNS.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

function row(subjectNumber: string, subjectName: string, commission: string, day: string, start: string, end: string, classroom = "212"): string[] {
  return ["ISI", "2023", subjectNumber, subjectName, commission, "manana", "anual", day, start, end, classroom, `"${TERM}"`, SOURCE, URL]
}

describe("reading import files", () => {
  it("parses quoted CSV fields with delimiters, quotes and line breaks", () => {
    const records = parseCsvRecords('a,"b, c","d ""e"""\r\n"x\ny",z,\n', ",")
    expect(records).toEqual([
      { line: 1, fields: ["a", "b, c", 'd "e"'] },
      { line: 2, fields: ["x\ny", "z", ""] },
    ])
  })

  it("groups rows of the same commission and matches subjects by career, plan and number", () => {
    const plan = buildCommissionImportPlan(
      csv([row("9", "Analisis Matematico II", "2K01", "Lunes", "08:00", "09:30"), row("9", "Análisis Matemático II", "2K01", "jueves", "10:15", "12:30")]),
      emptyCatalog,
    )
    expect(plan.format).toBe(CommissionImportFormat.Csv)
    expect(plan.issues).toEqual([])
    expect(plan.canApply).toBe(true)
    expect(plan.items).toHaveLength(1)
    expect(plan.items[0]).toMatchObject({
      status: CommissionImportStatus.Create,
      subjectId: 101,
      name: "2K01",
      shift: CommissionShift.Manana,
      period: CommissionPeriod.Anual,
      term: TERM,
      source: SOURCE,
      sourceUrl: URL,
      slots: [
        { day: ClassDay.Lunes, start: "08:00", end: "09:30", classroom: "212" },
        { day: ClassDay.Jueves, start: "10:15", end: "12:30", classroom: "212" },
      ],
    })
  })

  it("accepts JSON, either a list or an object with rows", () => {
    const value = { career: "isi", plan: 2023, subjectNumber: 13, commission: "2K01", shift: "Mañana", period: "Anual", day: "Miércoles", start: "08:00", end: "10:15", term: TERM, source: SOURCE }
    for (const content of [JSON.stringify([value]), JSON.stringify({ rows: [value] })]) {
      const plan = buildCommissionImportPlan(content, emptyCatalog)
      expect(plan.format).toBe(CommissionImportFormat.Json)
      expect(plan.items[0]).toMatchObject({ subjectId: 102, sourceUrl: null, slots: [{ day: ClassDay.Miercoles, classroom: null }] })
    }
  })

  it("rejects files it cannot read at all", () => {
    expect(() => buildCommissionImportPlan("   ", emptyCatalog)).toThrow(CommissionImportError)
    expect(() => buildCommissionImportPlan("career,plan\nISI,2023", emptyCatalog)).toThrow("Faltan columnas")
    expect(() => buildCommissionImportPlan("[{", emptyCatalog)).toThrow("El JSON no es válido")
  })
})

describe("validation", () => {
  it("reports invalid rows with their line and blocks the import", () => {
    const plan = buildCommissionImportPlan(csv([row("9", "", "2K01", "domingo", "10:00", "09:00"), row("9", "", "2K02", "lunes", "08:00", "09:30")]), emptyCatalog)
    expect(plan.canApply).toBe(false)
    expect(plan.issues).toHaveLength(1)
    expect(plan.issues[0].level).toBe(ImportIssueLevel.Error)
    expect(plan.issues[0].message).toContain("Línea 2")
    expect(plan.issues[0].message).toContain("El día debe ser de lunes a sábado")
    expect(plan.items.map((item) => item.name)).toEqual(["2K02"])
  })

  it("rejects unknown subjects and names that do not match the subject number", () => {
    const plan = buildCommissionImportPlan(csv([row("99", "", "2K01", "lunes", "08:00", "09:30"), row("13", "Química", "2K01", "lunes", "10:00", "11:00")]), emptyCatalog)
    expect(plan.items).toEqual([])
    expect(plan.issues.map((issue) => issue.message)).toEqual([
      "Línea 2: no existe la materia 99 en la carrera ISI plan 2023",
      "Línea 3: la materia 13 de ISI es Física II, no Química",
    ])
  })

  it("never maps a row of another plan onto this plan's subjects", () => {
    const plan2008 = row("9", "Análisis Matemático II", "4K01", "lunes", "14:00", "16:15")
    plan2008[1] = "2008"
    const plan = buildCommissionImportPlan(csv([plan2008]), emptyCatalog)
    expect(plan.items).toEqual([])
    expect(plan.issues.map((issue) => issue.message)).toEqual(["Línea 2: no existe la materia 9 en la carrera ISI plan 2008"])
  })

  it("rejects overlapping slots inside one commission and warns about repeated rows", () => {
    const overlap = buildCommissionImportPlan(csv([row("9", "", "2K01", "lunes", "08:00", "09:30"), row("9", "", "2K01", "lunes", "09:00", "10:00")]), emptyCatalog)
    expect(overlap.canApply).toBe(false)
    expect(overlap.issues[0].message).toContain("horarios superpuestos")

    const repeated = buildCommissionImportPlan(csv([row("9", "", "2K01", "lunes", "08:00", "09:30"), row("9", "", "2K01", "lunes", "08:00", "09:30")]), emptyCatalog)
    expect(repeated.canApply).toBe(true)
    expect(repeated.issues).toEqual([expect.objectContaining({ level: ImportIssueLevel.Warning, line: 3 })])
    expect(repeated.items[0].slots).toHaveLength(1)
  })

  it("rejects rows of one commission that disagree on shift or source", () => {
    const other = row("9", "", "2K01", "martes", "08:00", "09:30")
    other[5] = "noche"
    const plan = buildCommissionImportPlan(csv([row("9", "", "2K01", "lunes", "08:00", "09:30"), other]), emptyCatalog)
    expect(plan.canApply).toBe(false)
    expect(plan.issues[0].message).toContain("otro turno")
  })

  it("warns when two subjects of the same commission group overlap", () => {
    const plan = buildCommissionImportPlan(csv([row("9", "", "2K01", "lunes", "08:00", "09:30"), row("13", "", "2K01", "lunes", "09:00", "10:15")]), emptyCatalog)
    expect(plan.canApply).toBe(true)
    expect(plan.issues).toEqual([
      {
        level: ImportIssueLevel.Warning,
        line: null,
        message: "2K01: Análisis Matemático II (Lun 08:00–09:30 (212)) se superpone con Física II (Lun 09:00–10:15 (212))",
      },
    ])
  })
})

describe("diff against the catalog", () => {
  const existing: CatalogCommission = {
    id: 7,
    subjectId: 101,
    name: "2K01",
    shift: CommissionShift.Manana,
    period: CommissionPeriod.Anual,
    slots: [{ day: ClassDay.Lunes, start: "08:00", end: "09:30", classroom: "212" }],
    term: TERM,
    source: SOURCE,
    sourceUrl: URL,
  }

  it("marks identical commissions as unchanged and does not offer to import them", () => {
    const plan = buildCommissionImportPlan(csv([row("9", "", "2k01", "lunes", "08:00", "09:30")]), { subjects, commissions: [existing] })
    expect(plan.items[0]).toMatchObject({ status: CommissionImportStatus.Unchanged, existingId: 7, name: "2K01", changes: [] })
    expect(plan.canApply).toBe(false)
  })

  it("describes the changes of an existing commission", () => {
    const plan = buildCommissionImportPlan(csv([row("9", "", "2K01", "martes", "08:00", "09:30")]), { subjects, commissions: [existing] })
    expect(plan.items[0].status).toBe(CommissionImportStatus.Update)
    expect(plan.items[0].changes).toEqual(["Horarios: Lun 08:00–09:30 (212) → Mar 08:00–09:30 (212)"])
    expect(plan.counts).toEqual({ [CommissionImportStatus.Create]: 0, [CommissionImportStatus.Update]: 1, [CommissionImportStatus.Unchanged]: 0 })
  })

  it("treats another period as another commission", () => {
    const changed = row("9", "", "2K01", "lunes", "08:00", "09:30")
    changed[6] = "segundo_cuatrimestre"
    const plan = buildCommissionImportPlan(csv([changed]), { subjects, commissions: [existing] })
    expect(plan.items[0]).toMatchObject({ status: CommissionImportStatus.Create, period: CommissionPeriod.SegundoCuatrimestre })
  })
})

describe("normalizeSubjectName", () => {
  it("ignores case, accents and punctuation", () => {
    expect(normalizeSubjectName("Física  II.")).toBe(normalizeSubjectName("fisica ii"))
  })
})
