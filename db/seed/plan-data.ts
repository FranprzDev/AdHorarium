import type { RegimenCorrelatividades } from "@/docs/2023/interfaces/regimen"
import { plan_ing_civil_2023 } from "@/docs/2023/IngCivil"
import { plan_ing_electrica_2023 } from "@/docs/2023/IngElectrica"
import { plan_ing_electronica_2023 } from "@/docs/2023/IngElectronica"
import { plan_ing_en_sistemas_2023 } from "@/docs/2023/IngEnSistemas"
import { plan_ing_mecanica_2023 } from "@/docs/2023/IngMecanica"
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

type ExamTablesByCareer = Readonly<Record<string, Readonly<Record<string, ReadonlyArray<string>>>>>

export const SEED_EXAM_TABLES: SeedExamTable[] = [
  { name: ExamTable.MesaI, description: "Primera mesa de examen" },
  { name: ExamTable.MesaII, description: "Segunda mesa de examen" },
  { name: ExamTable.MesaIII, description: "Tercera mesa de examen" },
]

export const CAREER_SOURCES: CareerSource[] = [
  { code: CareerCode.Sistemas, name: "Ingeniería en Sistemas de Información", regimen: plan_ing_en_sistemas_2023 },
  { code: CareerCode.Electronica, name: "Ingeniería Electrónica", regimen: plan_ing_electronica_2023 },
  { code: CareerCode.Civil, name: "Ingeniería Civil", regimen: plan_ing_civil_2023 },
  { code: CareerCode.Mecanica, name: "Ingeniería Mecánica", regimen: plan_ing_mecanica_2023 },
  { code: CareerCode.EnergiaElectrica, name: "Ingeniería en Energía Eléctrica", regimen: plan_ing_electrica_2023 },
]

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

function countCareersPerSubjectName(sources: ReadonlyArray<CareerSource>): Map<string, number> {
  const counts = new Map<string, number>()
  for (const source of sources) {
    const names = new Set<string>()
    for (const level of source.regimen.regimen_correlatividades) {
      for (const subject of level.asignaturas) names.add(normalizeSubjectName(subject.nombre))
    }
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

export function buildSeedPlan(
  sources: ReadonlyArray<CareerSource> = CAREER_SOURCES,
  examTables: ExamTablesByCareer = materiasDB,
): SeedPlan {
  const careerNameCounts = countCareersPerSubjectName(sources)
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

    for (const [table, names] of Object.entries(careerExamTables ?? {})) {
      if (!isExamTable(table)) continue
      for (const name of names) {
        if (!matchedKeys.has(examTableLookupKey(name))) {
          unmatchedExamEntries.push({ careerCode: source.code, examTable: table, subjectName: name })
        }
      }
    }
  }

  return { careers, examTables: SEED_EXAM_TABLES, subjects, correlatives, unmatchedExamEntries }
}
