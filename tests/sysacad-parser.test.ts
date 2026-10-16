import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { buildSeedPlan } from "@/db/seed/plan-data"
import { isImportableRow, isOtherPlanRow, matchSysacadRows, OTHER_PLAN_METHODS, nameSimilarity, normalizeSubjectName, SysacadMatchMethod, type MatchableSubject } from "@/lib/sysacad/match"
import {
  buildSysacadImportUrl,
  buildSysacadPayload,
  decodeSysacadFragment,
  encodeSysacadFragment,
  SysacadFragmentError,
} from "@/lib/sysacad/payload"
import { checkSysacadPlan, SysacadPlanCheckKind } from "@/lib/sysacad/plan-check"
import { parseSysacadPayload } from "@/lib/sysacad/schema"
import { parseSysacadStatus } from "@/lib/sysacad/status"
import { detectColumns, dominantPlan, gridFromText, parseSysacadText, rowsFromGrid } from "@/lib/sysacad/table"
import { SysacadFragmentKey, SysacadRowStatus, SysacadSource, type SysacadRow } from "@/lib/sysacad/types"
import { CareerCode } from "@/types/enums"
import type { Career } from "@/types/types"

const fixture = (name: string) => readFileSync(new URL(`./fixtures/sysacad/${name}`, import.meta.url), "utf8")

/** Cell grid of the anonymized HTML fixture, read with a regex so the test needs no DOM. */
function gridFromFixtureHtml(html: string): string[][] {
  const grid: string[][] = []
  for (const row of html.matchAll(/<TR[^>]*>([\s\S]*?)<\/TR>/gi)) {
    const cells = [...row[1].matchAll(/<TD[^>]*>([\s\S]*?)<\/TD>/gi)].map((cell) =>
      cell[1].replace(/&nbsp;/g, "\u00a0").replace(/&amp;/g, "&").replace(/<[^>]+>/g, ""),
    )
    grid.push(cells)
  }
  return grid
}

const systemsSubjects: MatchableSubject[] = buildSeedPlan()
  .subjects.filter((subject) => subject.careerCode === CareerCode.Sistemas)
  .map((subject) => ({ id: subject.number, name: subject.name, level: subject.level }))

const subjectId = (name: string): number => {
  const subject = systemsSubjects.find((candidate) => candidate.name === name)
  if (!subject) throw new Error(`Missing subject ${name}`)
  return subject.id
}

describe("parseSysacadStatus", () => {
  it("reads an approval with grade, hours, tomo and folio", () => {
    expect(parseSysacadStatus("Aprobada con 8 (5 hs.) Tomo: 101 Folio: 11")).toEqual({ status: SysacadRowStatus.Approved, grade: 8 })
  })

  it("reads decimal hours without taking them as the grade", () => {
    expect(parseSysacadStatus("Aprobada con 9 (1.5 hs.) Tomo: 301 Folio: 31")).toEqual({ status: SysacadRowStatus.Approved, grade: 9 })
  })

  it("reads a 10 and decimal grades written with a comma", () => {
    expect(parseSysacadStatus("Aprobada con 10 (2 hs.) Tomo: 1 Folio: 1").grade).toBe(10)
    expect(parseSysacadStatus("Aprobada con 7,5 (2 hs.)").grade).toBe(7.5)
  })

  it("drops grades outside the 1 to 10 scale", () => {
    expect(parseSysacadStatus("Aprobada con 0 (2 hs.)")).toEqual({ status: SysacadRowStatus.Approved })
    expect(parseSysacadStatus("Aprobada con 11 (2 hs.)")).toEqual({ status: SysacadRowStatus.Approved })
  })

  it("reads an approval without grade (entrance course)", () => {
    expect(parseSysacadStatus("Aprobada en 2021")).toEqual({ status: SysacadRowStatus.Approved, approvedYear: 2021 })
  })

  it("reads regular subjects with and without term", () => {
    expect(parseSysacadStatus("Regular en 2022")).toEqual({ status: SysacadRowStatus.Regular, regularYear: 2022 })
    expect(parseSysacadStatus("Regular en 2025 (1C)")).toEqual({ status: SysacadRowStatus.Regular, regularYear: 2025, term: "1C" })
    expect(parseSysacadStatus("regular  en 2023 ( 2c )")).toEqual({ status: SysacadRowStatus.Regular, regularYear: 2023, term: "2C" })
  })

  it("reads the commission of a subject being taken", () => {
    expect(parseSysacadStatus("Cursa en 4K02 Aula 210 Casa Central")).toEqual({ status: SysacadRowStatus.Enrolled, commission: "4K02" })
    expect(parseSysacadStatus("Cursa")).toEqual({ status: SysacadRowStatus.Enrolled })
  })

  it("treats blank and non-breaking-space cells as no state", () => {
    expect(parseSysacadStatus("")).toEqual({ status: SysacadRowStatus.None })
    expect(parseSysacadStatus(" \u00a0 \n")).toEqual({ status: SysacadRowStatus.None })
  })

  it("keeps unknown text as raw", () => {
    expect(parseSysacadStatus("  Equivalencia   pendiente ")).toEqual({ status: SysacadRowStatus.Unknown, raw: "Equivalencia pendiente" })
  })

  it("accepts promoted and upper case wording", () => {
    expect(parseSysacadStatus("APROBADA CON 7 (3 HS.)")).toEqual({ status: SysacadRowStatus.Approved, grade: 7 })
    expect(parseSysacadStatus("Promocionada con 9")).toEqual({ status: SysacadRowStatus.Approved, grade: 9 })
  })
})

describe("SysAcad table parsing", () => {
  const htmlRows = rowsFromGrid(gridFromFixtureHtml(fixture("estado-academico.html")))

  it("reads every subject row of the page", () => {
    expect(htmlRows).toHaveLength(41)
    const byStatus = (status: SysacadRowStatus) => htmlRows.filter((row) => row.status === status).length
    expect(byStatus(SysacadRowStatus.Approved)).toBe(24 + 3)
    expect(byStatus(SysacadRowStatus.Regular)).toBe(4)
    expect(byStatus(SysacadRowStatus.Enrolled)).toBe(1)
    expect(byStatus(SysacadRowStatus.None)).toBe(9)
  })

  it("keeps names (accents, truncation) and plans as shown", () => {
    expect(htmlRows[0]).toEqual({ year: 0, name: "Física", plan: "2008", status: SysacadRowStatus.Approved, approvedYear: 2021 })
    expect(htmlRows.find((row) => row.name.startsWith("Auditoria"))?.name).toBe("Auditoria en Sistemas de Información (El")
    expect(htmlRows.find((row) => row.name === "Economía")).toEqual({
      year: 3,
      name: "Economía",
      plan: "2023",
      status: SysacadRowStatus.Regular,
      regularYear: 2023,
      term: "2C",
    })
    expect(htmlRows.find((row) => row.status === SysacadRowStatus.Enrolled)?.commission).toBe("4K02")
  })

  it("parses tab separated text copied from the page to the same rows", () => {
    expect(parseSysacadText(fixture("estado-academico.tsv.txt"))).toEqual(htmlRows)
  })

  it("parses text that lost its tabs", () => {
    expect(parseSysacadText(fixture("estado-academico.loose.txt"))).toEqual(htmlRows)
  })

  it("accepts Windows line endings", () => {
    expect(parseSysacadText(fixture("estado-academico.tsv.txt").replace(/\n/g, "\r\n"))).toEqual(htmlRows)
  })

  it("finds the header in any column order and with extra whitespace", () => {
    const grid = [
      ["Estado académico de Alumno"],
      ["  Plan ", "ESTADO", "Materia\n", "Año"],
      ["2023", "Regular en 2022", "Física  II", " 2 "],
    ]
    expect(rowsFromGrid(grid)).toEqual([{ year: 2, name: "Física II", plan: "2023", status: SysacadRowStatus.Regular, regularYear: 2022 }])
  })

  it("detects headers written without accents", () => {
    expect(detectColumns(["Ano", "Materia", "Estado", "Plan"])).not.toBeNull()
    expect(detectColumns(["Año", "Materia", "Plan"])).toBeNull()
  })

  it("assumes the published column order when there is no header", () => {
    expect(rowsFromGrid([["1", "Física I", "Aprobada con 8", "2023"]])).toEqual([
      { year: 1, name: "Física I", plan: "2023", status: SysacadRowStatus.Approved, grade: 8 },
    ])
  })

  it("ignores lines that are not subjects", () => {
    expect(gridFromText("Hola\n\n   \nIMPORTANTE: nada")).toEqual([])
    expect(parseSysacadText("Año\tMateria\tEstado\tPlan\nTotal\t\t\t")).toEqual([])
  })

  it("computes the dominant plan, ignoring the entrance course", () => {
    expect(dominantPlan(htmlRows)).toBe("2023")
    expect(dominantPlan([])).toBe("")
  })
})

describe("SysAcad payload", () => {
  const rows = parseSysacadText(fixture("estado-academico.tsv.txt"))
  const payload = buildSysacadPayload(rows, new Date("2026-03-01T13:00:00.000Z"))

  it("builds a versioned payload", () => {
    expect(payload).toMatchObject({ v: 1, source: SysacadSource.FrtSysacad, capturedAt: "2026-03-01T13:00:00.000Z", plan: "2023" })
    expect(parseSysacadPayload(payload)).toEqual(payload)
  })

  it("round trips through a plain fragment", async () => {
    const fragment = await encodeSysacadFragment(payload, Number.POSITIVE_INFINITY)
    expect(fragment.startsWith(`${SysacadFragmentKey.Plain}=`)).toBe(true)
    expect(fragment).toMatch(/^data=[A-Za-z0-9_-]+$/)
    expect(await decodeSysacadFragment(`#${fragment}`)).toEqual(payload)
  })

  it("deflates long payloads and still round trips", async () => {
    const fragment = await encodeSysacadFragment(payload)
    expect(fragment.startsWith(`${SysacadFragmentKey.Deflated}=`)).toBe(true)
    const plainLength = (await encodeSysacadFragment(payload, Number.POSITIVE_INFINITY)).length
    expect(fragment.length).toBeLessThan(plainLength / 2)
    expect(await decodeSysacadFragment(fragment)).toEqual(payload)
  })

  it("builds the import URL with the payload only in the fragment", async () => {
    const url = new URL(await buildSysacadImportUrl("https://adhorarium.vercel.app", payload))
    expect(url.origin + url.pathname + url.search).toBe("https://adhorarium.vercel.app/importar/sysacad")
    expect(await decodeSysacadFragment(url.hash)).toEqual(payload)
  })

  it("rejects missing, broken and oversized fragments", async () => {
    await expect(decodeSysacadFragment("#otra=1")).rejects.toBeInstanceOf(SysacadFragmentError)
    await expect(decodeSysacadFragment("#data=@@@")).rejects.toBeInstanceOf(SysacadFragmentError)
    await expect(decodeSysacadFragment("#dataz=AAAA")).rejects.toBeInstanceOf(SysacadFragmentError)
    await expect(decodeSysacadFragment(`#data=${"A".repeat(70_000)}`)).rejects.toThrow("demasiado grandes")
  })

  it("validates the payload shape", () => {
    expect(() => parseSysacadPayload({ ...payload, v: 2 })).toThrow("no es compatible")
    expect(() => parseSysacadPayload({ ...payload, rows: [] })).toThrow("ninguna materia")
    expect(() => parseSysacadPayload({ ...payload, rows: [{ ...rows[4], grade: 12 }] })).toThrow()
    expect(() => parseSysacadPayload({ ...payload, rows: [{ ...rows[4], status: "aprobada" }] })).toThrow()
    const withExtra = parseSysacadPayload({ ...payload, rows: [{ ...rows[4], tomo: "101" }] })
    expect(withExtra.rows[0]).toEqual(rows[4])
  })
})

describe("matching SysAcad rows to the plan", () => {
  const rows = parseSysacadText(fixture("estado-academico.tsv.txt"))
  const matches = matchSysacadRows(rows, systemsSubjects, "2023")
  const matchOf = (name: string) => {
    const match = matches.find((candidate) => candidate.row.name === name)
    if (!match) throw new Error(`Missing row ${name}`)
    return match
  }

  it("normalizes accents, case and punctuation", () => {
    expect(normalizeSubjectName("  Auditoría en Sistemas de Información (El")).toBe("auditoria en sistemas de informacion el")
    expect(normalizeSubjectName("Álgebra y Geometría Analítica")).toBe("algebra y geometria analitica")
  })

  it("matches exact names regardless of accents and case", () => {
    expect(matchOf("Álgebra y Geometría Analítica")).toMatchObject({ method: SysacadMatchMethod.Exact, subjectId: subjectId("Álgebra y Geometría Analítica") })
    expect(matchOf("Inglés I")).toMatchObject({ method: SysacadMatchMethod.Exact, subjectId: subjectId("Inglés I") })
    expect(matchSysacadRows([{ ...rows[3], name: "ALGORITMOS Y ESTRUCTURAS DE DATOS" }], systemsSubjects)[0]).toMatchObject({
      method: SysacadMatchMethod.Exact,
      subjectId: subjectId("Algoritmos y Estructuras de Datos"),
    })
  })

  it("matches names cut by the column width by prefix", () => {
    expect(matchOf("Administración de Sistemas de Informació")).toMatchObject({
      method: SysacadMatchMethod.Prefix,
      subjectId: subjectId("Administración de Sistemas de Información"),
    })
    expect(matchOf("Desarrollo de Software")).toMatchObject({ method: SysacadMatchMethod.Prefix, subjectId: subjectId("Desarrollo de Software I") })
  })

  it("lists the plan 2008 entrance course as another plan, with suggestions but no automatic match", () => {
    for (const name of ["Física", "Matemática", "Taller de Orientación Universitaria"]) {
      expect(matchOf(name)).toMatchObject({ method: SysacadMatchMethod.OtherPlan, subjectId: null })
    }
    expect(matchOf("Física").candidateIds).toEqual(expect.arrayContaining([subjectId("Física I"), subjectId("Física II")]))
  })

  it("never matches entrance course rows of the same plan to first year subjects", () => {
    const entrance = rows.filter((row) => row.year === 0).map((row) => ({ ...row, plan: "2023" }))
    for (const match of matchSysacadRows(entrance, systemsSubjects, "2023")) {
      expect(match).toMatchObject({ method: SysacadMatchMethod.EntranceCourse, subjectId: null })
    }
  })

  it("ties rows of another plan to the selected plan only by equivalent name", () => {
    const fromOldPlan = (name: string, year = 1): SysacadRow => ({ year, name, plan: "2008", status: SysacadRowStatus.Approved, grade: 8 })
    const [same, cut, typo, unknown] = matchSysacadRows(
      [fromOldPlan("Análisis Matemático I"), fromOldPlan("Administración de Sistemas de Informació", 5), fromOldPlan("Arquitectura de Computadores"), fromOldPlan("Sistemas de Representación")],
      systemsSubjects,
      "2023",
    )
    expect(same).toMatchObject({ method: SysacadMatchMethod.OtherPlanEquivalent, subjectId: subjectId("Análisis Matemático I") })
    expect(cut).toMatchObject({ method: SysacadMatchMethod.OtherPlanEquivalent, subjectId: subjectId("Administración de Sistemas de Información") })
    expect(typo).toMatchObject({ method: SysacadMatchMethod.OtherPlan, subjectId: null })
    expect(typo.candidateIds[0]).toBe(subjectId("Arquitectura de Computadoras"))
    expect(unknown).toMatchObject({ method: SysacadMatchMethod.OtherPlan, subjectId: null })
  })

  it("treats rows without a plan, or a career without a known plan, as the same plan", () => {
    expect(isOtherPlanRow({ ...rows[4], plan: "" }, "2023")).toBe(false)
    expect(isOtherPlanRow(rows[0], null)).toBe(false)
    expect(isOtherPlanRow(rows[0], "2023")).toBe(true)
    expect(OTHER_PLAN_METHODS.has(SysacadMatchMethod.OtherPlan)).toBe(true)
  })

  it("leaves subjects outside the plan unmatched", () => {
    expect(matchOf("Práctica Profesional Supervisada").subjectId).toBeNull()
  })

  it("ties an elective cut by the column width to the plan's elective", () => {
    expect(matchOf("Auditoria en Sistemas de Información (El")).toMatchObject({
      method: SysacadMatchMethod.Fuzzy,
      subjectId: subjectId("Auditoría en Sistemas de Información"),
    })
  })

  it("matches every other row of the fixture to a distinct plan subject", () => {
    const outside = new Set(["Física", "Matemática", "Taller de Orientación Universitaria", "Práctica Profesional Supervisada", "Auditoria en Sistemas de Información (El"])
    const matched = matches.filter((match) => !outside.has(match.row.name))
    expect(matched).toHaveLength(36)
    for (const match of matched) expect(match.subjectId, match.row.name).not.toBeNull()
    expect(new Set(matched.map((match) => match.subjectId)).size).toBe(36)
  })

  it("accepts small typos with a fuzzy match and offers candidates", () => {
    const [match] = matchSysacadRows([{ ...rows[5], name: "Arquitectura de Computadores" }], systemsSubjects)
    expect(match).toMatchObject({ method: SysacadMatchMethod.Fuzzy, subjectId: subjectId("Arquitectura de Computadoras") })
    expect(match.candidateIds[0]).toBe(subjectId("Arquitectura de Computadoras"))
  })

  it("asks the student when several subjects fit", () => {
    const [match] = matchSysacadRows([{ year: 2, name: "Fisica", plan: "2023", status: SysacadRowStatus.Regular }], systemsSubjects, "2023")
    expect(match.method).toBe(SysacadMatchMethod.Ambiguous)
    expect(match.subjectId).toBeNull()
    expect(match.candidateIds).toEqual(expect.arrayContaining([subjectId("Física I"), subjectId("Física II")]))
  })

  it("prefers the subject of the same level when a prefix fits several", () => {
    const subjects: MatchableSubject[] = [
      { id: 1, name: "Análisis Matemático I", level: 1 },
      { id: 2, name: "Análisis Matemático II", level: 2 },
    ]
    const row: SysacadRow = { year: 2, name: "Análisis Matemático", plan: "2023", status: SysacadRowStatus.Regular }
    expect(matchSysacadRows([row], subjects)[0]).toMatchObject({ method: SysacadMatchMethod.Prefix, subjectId: 2 })
    expect(matchSysacadRows([{ ...row, year: 3 }], subjects)[0]).toMatchObject({ method: SysacadMatchMethod.Ambiguous, candidateIds: [1, 2] })
  })

  it("scores similarity between 0 and 1", () => {
    expect(nameSimilarity("bases de datos", "bases de datos")).toBe(1)
    expect(nameSimilarity("a", "bases")).toBe(0)
    expect(nameSimilarity("redes de datos", "bases de datos")).toBeLessThan(0.8)
  })

  it("flags which rows carry a state to import", () => {
    expect(isImportableRow(matchOf("Física II").row)).toBe(true)
    expect(isImportableRow(matchOf("Inglés II").row)).toBe(false)
    expect(isImportableRow({ ...rows[4], status: SysacadRowStatus.Unknown, raw: "x" })).toBe(false)
  })
})

describe("checkSysacadPlan", () => {
  const rows = parseSysacadText(fixture("estado-academico.tsv.txt"))
  const systems2023: Career = { id: 1, code: "ISI", name: "Ingeniería en Sistemas de Información", plan: "2023" }
  const systems2008: Career = { id: 9, code: "ISI-2008", name: "Ingenieria en Sistemas de Informacion", plan: "2008" }
  const electronics2008: Career = { id: 3, code: "IE-2008", name: "Ingeniería Electrónica", plan: "2008" }
  const onPlan2008 = rows.map((row) => ({ ...row, plan: "2008" }))

  it("accepts a 2023 student whose entrance course rows say 2008", () => {
    expect(checkSysacadPlan(rows, systems2023, [systems2023])).toEqual({ kind: SysacadPlanCheckKind.SamePlan, sysacadPlan: "2023" })
  })

  it("offers to switch to the same career on the student's plan", () => {
    expect(checkSysacadPlan(onPlan2008, systems2023, [systems2023, electronics2008, systems2008])).toEqual({
      kind: SysacadPlanCheckKind.SwitchAvailable,
      sysacadPlan: "2008",
      career: systems2008,
    })
  })

  it("warns when AdHorarium does not have the student's plan", () => {
    expect(checkSysacadPlan(onPlan2008, systems2023, [systems2023, electronics2008])).toEqual({ kind: SysacadPlanCheckKind.PlanMissing, sysacadPlan: "2008" })
  })

  it("does not complain when SysAcad shows no plan", () => {
    expect(checkSysacadPlan(rows.map((row) => ({ ...row, plan: "" })), systems2023, []).kind).toBe(SysacadPlanCheckKind.SamePlan)
  })
})
