import { z } from "zod"
import { MAX_SUBJECT_LEVEL, MIN_SUBJECT_LEVEL } from "@/lib/subject-levels"
import { idSchema } from "@/lib/validation/student"
import { CorrelativePurpose, CorrelativeType, ExamTable } from "@/types/enums"

export const MAX_SUBJECT_NAME_LENGTH = 200
export const MAX_SUBJECT_NUMBER = 999
export const MAX_SUBJECT_HOURS = 999
export const MAX_SEARCH_LENGTH = 100

const levelSchema = z
  .number({ invalid_type_error: "Ingresá un nivel" })
  .int("El nivel debe ser un número entero")
  .min(MIN_SUBJECT_LEVEL, `El nivel debe estar entre ${MIN_SUBJECT_LEVEL} y ${MAX_SUBJECT_LEVEL}`)
  .max(MAX_SUBJECT_LEVEL, `El nivel debe estar entre ${MIN_SUBJECT_LEVEL} y ${MAX_SUBJECT_LEVEL}`)

export const subjectFieldsSchema = z.object({
  number: z
    .number({ invalid_type_error: "Ingresá un número" })
    .int("El número debe ser entero")
    .positive("El número debe ser mayor a cero")
    .max(MAX_SUBJECT_NUMBER, `El número no puede superar ${MAX_SUBJECT_NUMBER}`),
  name: z
    .string()
    .trim()
    .min(1, "Ingresá el nombre de la materia")
    .max(MAX_SUBJECT_NAME_LENGTH, `El nombre no puede superar ${MAX_SUBJECT_NAME_LENGTH} caracteres`),
  level: levelSchema,
  hours: z
    .number({ invalid_type_error: "Las horas deben ser un número" })
    .int("Las horas deben ser un número entero")
    .positive("Las horas deben ser mayores a cero")
    .max(MAX_SUBJECT_HOURS, `Las horas no pueden superar ${MAX_SUBJECT_HOURS}`)
    .nullable(),
  isElective: z.boolean(),
  isBasicScience: z.boolean(),
  examTable: z.nativeEnum(ExamTable).nullable(),
})

export const createSubjectInputSchema = subjectFieldsSchema.extend({ careerId: idSchema })

export const updateSubjectInputSchema = subjectFieldsSchema.extend({ id: idSchema })

export const subjectIdInputSchema = z.object({ subjectId: idSchema })

export const adminSubjectFiltersSchema = z.object({
  careerId: idSchema.nullable(),
  level: levelSchema.nullable(),
  search: z.string().trim().max(MAX_SEARCH_LENGTH),
})

export const correlativeInputSchema = z.object({
  subjectId: idSchema,
  requiredSubjectId: idSchema,
  purpose: z.nativeEnum(CorrelativePurpose),
  requirementType: z.nativeEnum(CorrelativeType),
})

export const correlativeIdInputSchema = z.object({ correlativeId: idSchema })

export type SubjectFields = z.infer<typeof subjectFieldsSchema>
export type CreateSubjectInput = z.infer<typeof createSubjectInputSchema>
export type UpdateSubjectInput = z.infer<typeof updateSubjectInputSchema>
export type AdminSubjectFilters = z.infer<typeof adminSubjectFiltersSchema>
export type CorrelativeInput = z.infer<typeof correlativeInputSchema>
