import { z } from "zod"
import { MAX_ARGENTINE_GRADE, MIN_ARGENTINE_GRADE } from "@/lib/gpa"
import { SubjectStatus } from "@/types/enums"

export const idSchema = z.number().int().positive()

export const careerIdInputSchema = z.object({ careerId: idSchema })

export const updateSubjectStateInputSchema = z
  .object({
    subjectId: idSchema,
    status: z.nativeEnum(SubjectStatus),
    grade: z.number().min(MIN_ARGENTINE_GRADE).max(MAX_ARGENTINE_GRADE).nullable(),
  })
  .refine((input) => input.grade === null || input.status === SubjectStatus.Promocionada, {
    message: "Solo una materia promocionada puede tener nota",
    path: ["grade"],
  })

export type CareerIdInput = z.infer<typeof careerIdInputSchema>
export type UpdateSubjectStateInput = z.infer<typeof updateSubjectStateInputSchema>
