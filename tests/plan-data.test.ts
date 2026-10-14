import { describe, expect, it } from "vitest"
import { buildSeedPlan, examTableLookupKey, normalizeSubjectName } from "@/db/seed/plan-data"
import { CareerCode, CorrelativePurpose, CorrelativeType, ExamTable } from "@/types/enums"

const plan = buildSeedPlan()

function subjectsOf(code: CareerCode) {
  return plan.subjects.filter((subject) => subject.careerCode === code)
}

describe("seed plan data", () => {
  it("seeds the five careers and the three exam tables", () => {
    expect(plan.careers.map((career) => career.code).sort()).toEqual(Object.values(CareerCode).sort())
    expect(plan.examTables.map((table) => table.name)).toEqual([ExamTable.MesaI, ExamTable.MesaII, ExamTable.MesaIII])
  })

  it("keeps the official subject counts per career", () => {
    expect(subjectsOf(CareerCode.Sistemas)).toHaveLength(36)
    expect(subjectsOf(CareerCode.Electronica)).toHaveLength(37)
    expect(subjectsOf(CareerCode.Civil)).toHaveLength(41)
    expect(subjectsOf(CareerCode.Mecanica)).toHaveLength(40)
    expect(subjectsOf(CareerCode.EnergiaElectrica)).toHaveLength(41)
  })

  it("transcribes Civil 2023 correlatives from Ordinance 1854", () => {
    const civil = plan.correlatives.filter((c) => c.careerCode === CareerCode.Civil)
    const of = (number: number, type: CorrelativeType) =>
      civil
        .filter((c) => c.subjectNumber === number && c.requirementType === type)
        .map((c) => c.requiredNumber)
        .sort((a, b) => a - b)
    expect(of(16, CorrelativeType.Regulares)).toEqual([10])
    expect(of(16, CorrelativeType.Aprobadas)).toEqual([1, 2, 7, 8])
    expect(of(22, CorrelativeType.Regulares)).toEqual([11, 12, 13])
    expect(of(31, CorrelativeType.Regulares)).toEqual([16, 18, 19, 20, 24, 25])
    expect(subjectsOf(CareerCode.Civil).find((s) => s.number === 41)?.level).toBe(6)
    expect(subjectsOf(CareerCode.Civil).find((s) => s.number === 19)?.name).toBe("Geotopografía")
  })

  it("never stores the same requirement twice for one purpose", () => {
    const keys = plan.correlatives.map((c) => `${c.careerCode}-${c.subjectNumber}-${c.requiredNumber}-${c.purpose}`)
    expect(new Set(keys).size).toBe(keys.length)
    expect(plan.correlatives.every((c) => c.purpose === CorrelativePurpose.Cursar)).toBe(true)
  })

  it("marks subjects shared by several careers as basic sciences", () => {
    const algebra = subjectsOf(CareerCode.Sistemas).find((s) => s.number === 2)
    expect(algebra?.isBasicScience).toBe(true)
    const paradigms = subjectsOf(CareerCode.Sistemas).find((s) => s.name === "Paradigmas de Programación")
    expect(paradigms?.isBasicScience).toBe(false)
  })

  it("assigns exam tables by normalized name and abbreviation aliases", () => {
    expect(normalizeSubjectName("Álgebra y Geometría  Analítica")).toBe("algebra y geometria analitica")
    expect(examTableLookupKey("Alg y Geometría Analítica")).toBe("algebra y geometria analitica")
    expect(subjectsOf(CareerCode.Sistemas).find((s) => s.number === 2)?.examTable).toBe(ExamTable.MesaII)
    expect(subjectsOf(CareerCode.Sistemas).find((s) => s.number === 1)?.examTable).toBe(ExamTable.MesaI)
  })
})
