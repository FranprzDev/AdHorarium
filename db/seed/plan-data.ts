import type { RegimenCorrelatividades } from "@/docs/2023/interfaces/regimen"
import { plan_ing_civil_2023 } from "@/docs/2023/IngCivil"
import { plan_ing_electrica_2023 } from "@/docs/2023/IngElectrica"
import { plan_ing_electronica_2023 } from "@/docs/2023/IngElectronica"
import { plan_ing_en_sistemas_2023 } from "@/docs/2023/IngEnSistemas"
import { plan_ing_mecanica_2023 } from "@/docs/2023/IngMecanica"
import { ISI_2008_CATALOG } from "@/db/seed/catalog/isi-2008"
import { ISI_2023_ADDITIONS } from "@/db/seed/catalog/isi-2023-additions"
import type { CatalogPlanData } from "@/db/seed/catalog/types"
import materiasDB from "@/data/materias.db"
import { parseLevel } from "@/lib/plan-integrity"
import { CareerCode, CorrelativePurpose, CorrelativeType, ExamTable } from "@/types/enums"

export type SeedCareer = {
  code: CareerCode
  name: string
  plan: string
}

export type SeedSubject = {
  careerCode: CareerCode
  number: number
  name: string
  level: number
  /** Weekly hours when the official source publishes them. */
  hours: number | null
  isElective: boolean
  isBasicScience: boolean
  examTable: ExamTable | null
}

export type SeedCorrelative = {
  careerCode: CareerCode
  subjectNumber: number
  requiredNumber: number
  purpose: CorrelativePurpose
  requirementType: CorrelativeType
}

export type SeedExamTable = {
  name: ExamTable
  description: string
}

export type UnmatchedExamEntry = {
  careerCode: CareerCode
  examTable: ExamTable
  subjectName: string
}

export type SeedPlan = {
  careers: SeedCareer[]
  examTables: SeedExamTable[]
  subjects: SeedSubject[]
  correlatives: SeedCorrelative[]
  unmatchedExamEntries: UnmatchedExamEntry[]
}

type CareerSource = {
  code: CareerCode
  name: string
  regimen: RegimenCorrelatividades
}

/** A career whose subjects are transcribed in the catalog format (hours, electives, correlatives to sit). */
type CatalogCareerSource = {
  code: CareerCode
  name: string
  plan: string
  data: CatalogPlanData
}

/** Subjects added to a career seeded from a `CareerSource` (electives and subjects its ordinance does not list). */
type CatalogAddition = {
  code: CareerCode
  data: CatalogPlanData
}

type ExamTablesByCareer = Readonly<Record<string, Readonly<Record<string, ReadonlyArray<string>>>>>

export const SEED_EXAM_TABLES: SeedExamTable[] = [
  { name: ExamTable.MesaI, description: "Primera mesa de examen" },
  { name: ExamTable.MesaII, description: "Segunda mesa de examen" },
  { name: ExamTable.MesaIII, description: "Tercera mesa de examen" },
]

export const SISTEMAS_CAREER_NAME = "Ingeniería en Sistemas de Información"

export const CAREER_SOURCES: CareerSource[] = [
  { code: CareerCode.Sistemas, name: SISTEMAS_CAREER_NAME, regimen: plan_ing_en_sistemas_2023 },
  { code: CareerCode.Electronica, name: "Ingeniería Electrónica", regimen: plan_ing_electronica_2023 },
  { code: CareerCode.Civil, name: "Ingeniería Civil", regimen: plan_ing_civil_2023 },
  { code: CareerCode.Mecanica, name: "Ingeniería Mecánica", regimen: plan_ing_mecanica_2023 },
  { code: CareerCode.EnergiaElectrica, name: "Ingeniería en Energía Eléctrica", regimen: plan_ing_electrica_2023 },
]

export const CATALOG_CAREER_SOURCES: CatalogCareerSource[] = [
  { code: CareerCode.SistemasPlan2008, name: SISTEMAS_CAREER_NAME, plan: "2008", data: ISI_2008_CATALOG },
]

export const CATALOG_ADDITIONS: CatalogAddition[] = [{ code: CareerCode.Sistemas, data: ISI_2023_ADDITIONS }]

export const BASIC_SCIENCE_MIN_CAREERS = 2

export const EXAM_TABLE_NAME_ALIASES: Readonly<Record<string, string>> = {
  "alg y geometria analitica": "algebra y geometria analitica",
  "alg y geom analitica": "algebra y geometria analitica",
  "algebra y geometrica analitica": "algebra y geometria analitica",
  "algoritmo estructuras de datos": "algoritmos y estructuras de datos",
  "logica y discreta": "logica y estructuras discretas",
  "probabilidades estadisticas": "probabilidad y estadistica",
  "resistencia de los materiales": "resistencia de materiales",
  "instalacion sanitaria y de gas": "instalaciones sanitarias y de gas",
  "hidrologia y obras": "hidrologia y obras hidraulicas",
  "tecnologia de fabricacion": "tecnologia de la fabricacion",
  "metrologia e ingenieria de calidad": "metrologia e ingenieria de la calidad",
  "termodinamica s y q": "termodinamica",
  "sistema de control": "sistemas de control",
  "generacion transmision y distribucion de energia electrica": "generacion transmision y distribucion de la energia electrica",
  "maquinas termicas hidraulicas y de fluidos": "maquinas termicas hidraulicas y de fluido",
  "instalaciones electricas y luminotecnica": "instalaciones electricas y luminotecnia",
  "tecnologia y ensayos de materiales electricos": "tecnologias y ensayos de materiales electricos",
}

export function examTableLookupKey(name: string): string {
  const key = normalizeSubjectName(name)
  return EXAM_TABLE_NAME_ALIASES[key] ?? key
}

export function normalizeSubjectName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\(electiva\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function isExamTable(value: string): value is ExamTable {
  return (Object.values(ExamTable) as string[]).includes(value)
}

/**
 * How many different careers teach each subject name. Two plans of the same career (ISI 2008 and 2023) count once,
 * so a subject shared only by them is not a basic science.
 */
function countCareersPerSubjectName(
  sources: ReadonlyArray<CareerSource>,
  catalogSources: ReadonlyArray<CatalogCareerSource>,
): Map<string, number> {
  const namesByCareer = new Map<string, Set<string>>()
  const namesOf = (careerName: string) => {
    const names = namesByCareer.get(careerName) ?? new Set<string>()
    namesByCareer.set(careerName, names)
    return names
  }
  for (const source of sources) {
    const names = namesOf(source.name)
    for (const level of source.regimen.regimen_correlatividades) {
      for (const subject of level.asignaturas) names.add(normalizeSubjectName(subject.nombre))
    }
  }
  for (const source of catalogSources) {
    const names = namesOf(source.name)
    for (const subject of source.data.subjects) {
      if (!subject.isElective) names.add(normalizeSubjectName(subject.name))
    }
  }
  const counts = new Map<string, number>()
  for (const names of namesByCareer.values()) {
    for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return counts
}

function examTableIndex(entries: Readonly<Record<string, ReadonlyArray<string>>> | undefined): Map<string, ExamTable> {
  const index = new Map<string, ExamTable>()
  if (!entries) return index
  for (const [table, names] of Object.entries(entries)) {
    if (!isExamTable(table)) continue
    for (const name of names) {
      const key = examTableLookupKey(name)
      if (!index.has(key)) index.set(key, table)
    }
  }
  return index
}

type CatalogSubjectsInput = {
  code: CareerCode
  data: CatalogPlanData
  examIndex: Map<string, ExamTable>
  matchedKeys: Set<string>
  careerNameCounts: Map<string, number>
}

function addCatalogSubjects(input: CatalogSubjectsInput, subjects: SeedSubject[], correlatives: SeedCorrelative[]): void {
  for (const subject of input.data.subjects) {
    const key = normalizeSubjectName(subject.name)
    const examTable = input.examIndex.get(key) ?? null
    if (examTable) input.matchedKeys.add(key)
    subjects.push({
      careerCode: input.code,
      number: subject.number,
      name: subject.name,
      level: subject.level,
      hours: subject.hours,
      isElective: subject.isElective,
      isBasicScience: !subject.isElective && (input.careerNameCounts.get(key) ?? 0) >= BASIC_SCIENCE_MIN_CAREERS,
      examTable,
    })
  }
  for (const correlative of input.data.correlatives) {
    correlatives.push({
      careerCode: input.code,
      subjectNumber: correlative.subjectNumber,
      requiredNumber: correlative.requiredNumber,
      purpose: correlative.purpose,
      requirementType: correlative.requirementType,
    })
  }
}

function collectUnmatchedExamEntries(
  code: CareerCode,
  careerExamTables: Readonly<Record<string, ReadonlyArray<string>>> | undefined,
  matchedKeys: ReadonlySet<string>,
  unmatched: UnmatchedExamEntry[],
): void {
  for (const [table, names] of Object.entries(careerExamTables ?? {})) {
    if (!isExamTable(table)) continue
    for (const name of names) {
      if (!matchedKeys.has(examTableLookupKey(name))) unmatched.push({ careerCode: code, examTable: table, subjectName: name })
    }
  }
}

export function buildSeedPlan(
  sources: ReadonlyArray<CareerSource> = CAREER_SOURCES,
  examTables: ExamTablesByCareer = materiasDB,
  catalogSources: ReadonlyArray<CatalogCareerSource> = CATALOG_CAREER_SOURCES,
  catalogAdditions: ReadonlyArray<CatalogAddition> = CATALOG_ADDITIONS,
): SeedPlan {
  const careerNameCounts = countCareersPerSubjectName(sources, catalogSources)
  const careers: SeedCareer[] = []
  const subjects: SeedSubject[] = []
  const correlatives: SeedCorrelative[] = []
  const unmatchedExamEntries: UnmatchedExamEntry[] = []

  for (const source of sources) {
    careers.push({ code: source.code, name: source.name, plan: source.regimen.plan })
    const careerExamTables = examTables[source.name]
    const examIndex = examTableIndex(careerExamTables)
    const matchedKeys = new Set<string>()

    for (const level of source.regimen.regimen_correlatividades) {
      const levelNumber = parseLevel(level.nivel)
      for (const subject of level.asignaturas) {
        const key = normalizeSubjectName(subject.nombre)
        const examTable = examIndex.get(key) ?? null
        if (examTable) matchedKeys.add(key)
        subjects.push({
          careerCode: source.code,
          number: subject.numero,
          name: subject.nombre.trim(),
          level: levelNumber,
          hours: null,
          isElective: false,
          isBasicScience: (careerNameCounts.get(key) ?? 0) >= BASIC_SCIENCE_MIN_CAREERS,
          examTable,
        })
        const approvedRequired = new Set(subject.para_cursar_aprobar)
        for (const required of subject.para_cursar_cursar) {
          if (approvedRequired.has(required)) continue
          correlatives.push({
            careerCode: source.code,
            subjectNumber: subject.numero,
            requiredNumber: required,
            purpose: CorrelativePurpose.Cursar,
            requirementType: CorrelativeType.Regulares,
          })
        }
        for (const required of approvedRequired) {
          correlatives.push({
            careerCode: source.code,
            subjectNumber: subject.numero,
            requiredNumber: required,
            purpose: CorrelativePurpose.Cursar,
            requirementType: CorrelativeType.Aprobadas,
          })
        }
      }
    }

    for (const addition of catalogAdditions) {
      if (addition.code !== source.code) continue
      addCatalogSubjects(
        { code: source.code, data: addition.data, examIndex, matchedKeys, careerNameCounts },
        subjects,
        correlatives,
      )
    }

    collectUnmatchedExamEntries(source.code, careerExamTables, matchedKeys, unmatchedExamEntries)
  }

  for (const source of catalogSources) {
    careers.push({ code: source.code, name: source.name, plan: source.plan })
    const careerExamTables = examTables[source.name]
    const examIndex = examTableIndex(careerExamTables)
    const matchedKeys = new Set<string>()
    addCatalogSubjects({ code: source.code, data: source.data, examIndex, matchedKeys, careerNameCounts }, subjects, correlatives)
    collectUnmatchedExamEntries(source.code, careerExamTables, matchedKeys, unmatchedExamEntries)
  }

  return { careers, examTables: SEED_EXAM_TABLES, subjects, correlatives, unmatchedExamEntries }
}
