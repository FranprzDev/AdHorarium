import type { CorrelativePurpose, CorrelativeType } from "@/types/enums"
import type { CatalogSource } from "@/db/seed/catalog/sources"

/** One subject transcribed from an official plan document; `source` is the URL it was read from. */
export type CatalogSubject = {
  number: number
  name: string
  level: number
  /** Weekly hours as published (cuatrimestral subjects carry their weekly load); null when the source gives none. */
  hours: number | null
  isElective: boolean
  source: CatalogSource
}

/** One correlative requirement between two subjects of the same plan, by subject number. */
export type CatalogCorrelative = {
  subjectNumber: number
  requiredNumber: number
  purpose: CorrelativePurpose
  requirementType: CorrelativeType
  source: CatalogSource
}

export type CatalogPlanData = {
  subjects: CatalogSubject[]
  correlatives: CatalogCorrelative[]
}
