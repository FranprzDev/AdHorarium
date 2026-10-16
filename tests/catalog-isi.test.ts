import { describe, expect, it } from "vitest"
import { ISI_2008_CATALOG } from "@/db/seed/catalog/isi-2008"
import { ISI_2023_ADDITIONS } from "@/db/seed/catalog/isi-2023-additions"
import { CatalogSource } from "@/db/seed/catalog/sources"
import type { CatalogPlanData } from "@/db/seed/catalog/types"
import { buildSeedPlan, SISTEMAS_CAREER_NAME } from "@/db/seed/plan-data"
import { matchSysacadRows, SysacadMatchMethod } from "@/lib/sysacad/match"
import { checkSysacadPlan, SysacadPlanCheckKind } from "@/lib/sysacad/plan-check"
import { SysacadRowStatus, type SysacadRow } from "@/lib/sysacad/types"
import { CareerCode, CorrelativePurpose, CorrelativeType } from "@/types/enums"
import type { Career } from "@/types/types"

const plan = buildSeedPlan()

function requirements(data: CatalogPlanData, number: number, purpose: CorrelativePurpose, type: CorrelativeType): number[] {
  return data.correlatives
    .filter((c) => c.subjectNumber === number && c.purpose === purpose && c.requirementType === type)
    .map((c) => c.requiredNumber)
    .sort((a, b) => a - b)
}

function subjectOf(code: CareerCode, number: number) {
  return plan.subjects.find((subject) => subject.careerCode === code && subject.number === number)
}

describe("ISI plan 2008 catalog", () => {
  it("is a separate career with the same name on plan 2008", () => {
    const career = plan.careers.find((item) => item.code === CareerCode.SistemasPlan2008)
    expect(career).toEqual({ code: CareerCode.SistemasPlan2008, name: SISTEMAS_CAREER_NAME, plan: "2008" })
    expect(plan.careers.find((item) => item.code === CareerCode.Sistemas)?.name).toBe(SISTEMAS_CAREER_NAME)
  })

  it("keeps the 36 obligatory subjects and the 28 electives of 2026", () => {
    const obligatory = ISI_2008_CATALOG.subjects.filter((subject) => !subject.isElective)
    const electives = ISI_2008_CATALOG.subjects.filter((subject) => subject.isElective)
    expect(obligatory).toHaveLength(36)
    expect(electives).toHaveLength(28)
    expect(ISI_2008_CATALOG.correlatives).toHaveLength(334)
    expect(obligatory.filter((subject) => subject.number <= 35).every((subject) => subject.source === CatalogSource.Plan2008Correlatives)).toBe(true)
    expect(electives.every((subject) => subject.source === CatalogSource.Electives2026)).toBe(true)
  })

  it("transcribes the 2017 correlatives table of Res. 775/2008", () => {
    const adm = 26
    expect(ISI_2008_CATALOG.subjects.find((subject) => subject.number === adm)).toMatchObject({ name: "Administración de Recursos", level: 4, hours: 6 })
    expect(requirements(ISI_2008_CATALOG, adm, CorrelativePurpose.Cursar, CorrelativeType.Regulares)).toEqual([16, 19, 23])
    expect(requirements(ISI_2008_CATALOG, adm, CorrelativePurpose.Cursar, CorrelativeType.Aprobadas)).toEqual([6, 13, 15, 17])
    expect(requirements(ISI_2008_CATALOG, adm, CorrelativePurpose.Rendir, CorrelativeType.Aprobadas)).toEqual([16, 19, 23])
    expect(requirements(ISI_2008_CATALOG, 32, CorrelativePurpose.Cursar, CorrelativeType.Aprobadas)).toEqual([8, 9, 16, 18, 19, 20, 22, 23, 24])
  })

  it("adds the 2026 electives with their sheet correlatives", () => {
    const genetic = ISI_2008_CATALOG.subjects.find((subject) => subject.name === "Algoritmos Genéticos y Optimización Heurística")
    expect(genetic).toMatchObject({ level: 4, hours: 4, isElective: true })
    const number = genetic?.number ?? 0
    expect(requirements(ISI_2008_CATALOG, number, CorrelativePurpose.Cursar, CorrelativeType.Regulares)).toEqual([21])
    expect(requirements(ISI_2008_CATALOG, number, CorrelativePurpose.Cursar, CorrelativeType.Aprobadas)).toEqual([14, 15, 18])
  })
})

describe("ISI plan 2023 additions", () => {
  it("adds Seminario Integrador and 28 electives after the 36 subjects of Ord. 1877", () => {
    expect(ISI_2023_ADDITIONS.subjects.map((subject) => subject.number)).toEqual(Array.from({ length: 29 }, (_, index) => 37 + index))
    expect(subjectOf(CareerCode.Sistemas, 37)).toMatchObject({ name: "Seminario Integrador", level: 3, isElective: false })
    expect(requirements(ISI_2023_ADDITIONS, 37, CorrelativePurpose.Cursar, CorrelativeType.Regulares)).toEqual([14])
    expect(requirements(ISI_2023_ADDITIONS, 37, CorrelativePurpose.Cursar, CorrelativeType.Aprobadas)).toEqual([5, 8, 10, 11])
    expect(ISI_2023_ADDITIONS.subjects.filter((subject) => subject.isElective)).toHaveLength(28)
    expect(ISI_2023_ADDITIONS.correlatives).toHaveLength(175)
  })

  it("expands 'todas las materias del 1er nivel' to the eight first-level subjects", () => {
    const visual = ISI_2023_ADDITIONS.subjects.find((subject) => subject.name === "Programación de Aplicaciones Visuales")
    expect(requirements(ISI_2023_ADDITIONS, visual?.number ?? 0, CorrelativePurpose.Cursar, CorrelativeType.Aprobadas)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it("never marks electives as basic sciences and keeps the 2023 basic sciences unchanged", () => {
    const electives = plan.subjects.filter((subject) => subject.isElective)
    expect(electives).toHaveLength(56)
    expect(electives.every((subject) => !subject.isBasicScience)).toBe(true)
    expect(subjectOf(CareerCode.Sistemas, 12)?.isBasicScience).toBe(false)
    expect(subjectOf(CareerCode.Sistemas, 1)?.isBasicScience).toBe(true)
  })
})

describe("catalog integrity", () => {
  it.each([
    ["2008", ISI_2008_CATALOG, new Set<number>()],
    ["2023", ISI_2023_ADDITIONS, new Set(Array.from({ length: 36 }, (_, index) => index + 1))],
  ])("plan %s has unique subjects and correlatives that point inside the plan", (_label, data, existing) => {
    const numbers = new Set(data.subjects.map((subject) => subject.number))
    const names = new Set(data.subjects.map((subject) => subject.name))
    expect(numbers.size).toBe(data.subjects.length)
    expect(names.size).toBe(data.subjects.length)
    for (const correlative of data.correlatives) {
      expect(correlative.subjectNumber).not.toBe(correlative.requiredNumber)
      expect(numbers.has(correlative.requiredNumber) || existing.has(correlative.requiredNumber)).toBe(true)
    }
  })
})

describe("SysAcad import with the seeded careers", () => {
  const careers: Career[] = plan.careers.map((career, index) => ({ id: index + 1, ...career }))
  const sistemas2023 = careers.find((career) => career.code === CareerCode.Sistemas)
  const sistemas2008 = careers.find((career) => career.code === CareerCode.SistemasPlan2008)
  const row = (name: string, year: number): SysacadRow => ({ year, name, plan: "2008", status: SysacadRowStatus.Approved, grade: 8 })
  const rows = [row("Gestión de Datos", 3), row("Matemática Superior", 3), row("Redes de Información", 4)]

  it("offers to switch a plan 2008 student to ISI plan 2008", () => {
    if (!sistemas2023 || !sistemas2008) throw new Error("ISI careers missing from the seed")
    expect(checkSysacadPlan(rows, sistemas2023, careers)).toEqual({ kind: SysacadPlanCheckKind.SwitchAvailable, sysacadPlan: "2008", career: sistemas2008 })
  })

  it("matches plan 2008 rows by name once the student is on ISI plan 2008", () => {
    const subjects = plan.subjects
      .filter((subject) => subject.careerCode === CareerCode.SistemasPlan2008)
      .map((subject) => ({ id: subject.number, name: subject.name, level: subject.level }))
    const matches = matchSysacadRows(rows, subjects, "2008")
    expect(matches.map((match) => [match.method, match.subjectId])).toEqual([
      [SysacadMatchMethod.Exact, 22],
      [SysacadMatchMethod.Exact, 21],
      [SysacadMatchMethod.Exact, 25],
    ])
  })
})
