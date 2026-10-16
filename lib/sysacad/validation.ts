import { z } from "zod"
import { idSchema } from "@/lib/validation/student"
import { MAX_ARGENTINE_GRADE, MIN_ARGENTINE_GRADE } from "@/lib/gpa"
import { SubjectStatus } from "@/types/enums"
import { SysacadImportMode } from "./plan"
import { MAX_SYSACAD_ROWS } from "./schema"

export const sysacadImportItemSchema = z
  .object({
    subjectId: idSchema,
    status: z.nativeEnum(SubjectStatus),
    grade: z.number().min(MIN_ARGENTINE_GRADE).max(MAX_ARGENTINE_GRADE).nullable(),
  })
  .refine((item) => item.grade === null || item.status === SubjectStatus.Promocionada, {
    message: "Solo una materia promocionada puede tener nota",
    path: ["grade"],
  })

export const sysacadImportInputSchema = z.object({
  careerId: idSchema,
  mode: z.nativeEnum(SysacadImportMode),
  items: z.array(sysacadImportItemSchema).min(1, "Elegí al menos una materia para importar.").max(MAX_SYSACAD_ROWS),
})

export type SysacadImportInput = z.infer<typeof sysacadImportInputSchema>
