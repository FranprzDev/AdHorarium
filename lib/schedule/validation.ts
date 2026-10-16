import { z } from "zod"
import { hasInternalOverlap } from "@/lib/schedule/overlaps"
import { TIME_PATTERN, toMinutes } from "@/lib/schedule/time"
import { idSchema } from "@/lib/validation/student"
import { ClassDay, CommissionPeriod, CommissionShift, ScheduleEntryKind, ScheduleImportMode } from "@/types/enums"

export const MAX_COMMISSION_NAME_LENGTH = 40
export const MAX_CLASSROOM_LENGTH = 40
export const MAX_SLOTS_PER_ENTRY = 12
export const MAX_DISPLAY_NAME_LENGTH = 60
export const MAX_SHARED_ENTRIES = 40
/** Share ids are 16 random bytes encoded as base64url (22 characters). */
export const SHARE_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/

const timeSchema = z.string().regex(TIME_PATTERN, "Usá el formato HH:MM")

const optionalText = (maxLength: number, message: string) =>
  z
    .string()
    .trim()
    .max(maxLength, message)
    .nullable()
    .transform((value) => (value === null || value.length === 0 ? null : value))

export const classSlotSchema = z
  .object({
    day: z.nativeEnum(ClassDay),
    start: timeSchema,
    end: timeSchema,
    classroom: optionalText(MAX_CLASSROOM_LENGTH, `El aula no puede superar ${MAX_CLASSROOM_LENGTH} caracteres`),
  })
  .refine((slot) => toMinutes(slot.start) < toMinutes(slot.end), {
    message: "La hora de fin debe ser posterior a la de inicio",
    path: ["end"],
  })

export const classSlotsSchema = z
  .array(classSlotSchema)
  .min(1, "Agregá al menos un horario")
  .max(MAX_SLOTS_PER_ENTRY, `No se pueden cargar más de ${MAX_SLOTS_PER_ENTRY} horarios`)
  .refine((slots) => !hasInternalOverlap(slots), { message: "Hay horarios superpuestos dentro de la misma comisión" })

const commissionNameSchema = z
  .string()
  .trim()
  .min(1, "Ingresá el nombre de la comisión")
  .max(MAX_COMMISSION_NAME_LENGTH, `El nombre no puede superar ${MAX_COMMISSION_NAME_LENGTH} caracteres`)

export const commissionFieldsSchema = z.object({
  name: commissionNameSchema,
  shift: z.nativeEnum(CommissionShift),
  period: z.nativeEnum(CommissionPeriod),
  slots: classSlotsSchema,
})

export const createCommissionInputSchema = commissionFieldsSchema.extend({ subjectId: idSchema })
export const updateCommissionInputSchema = commissionFieldsSchema.extend({ id: idSchema })
export const deleteCommissionInputSchema = z.object({
  commissionId: idSchema,
  /** When true, timetables that use the commission keep its slots as custom entries. */
  detachEntries: z.boolean(),
})

export const pickCommissionInputSchema = z.object({ commissionId: idSchema })

export const customEntryFieldsSchema = z.object({
  label: commissionNameSchema,
  slots: classSlotsSchema,
})

export const createCustomEntryInputSchema = customEntryFieldsSchema.extend({ subjectId: idSchema })
export const updateCustomEntryInputSchema = customEntryFieldsSchema.extend({ id: idSchema })
export const entryIdInputSchema = z.object({ entryId: idSchema })

export const sharedEntrySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal(ScheduleEntryKind.Commission), subjectId: idSchema, commissionId: idSchema }),
  z.object({
    kind: z.literal(ScheduleEntryKind.Custom),
    subjectId: idSchema,
    label: commissionNameSchema,
    slots: classSlotsSchema,
  }),
])

export const sharedEntriesSchema = z.array(sharedEntrySchema).max(MAX_SHARED_ENTRIES)

export const createShareInputSchema = z.object({
  displayName: optionalText(MAX_DISPLAY_NAME_LENGTH, `El nombre no puede superar ${MAX_DISPLAY_NAME_LENGTH} caracteres`),
})

export const shareIdSchema = z.string().regex(SHARE_ID_PATTERN, "El enlace no es válido")

export const importShareInputSchema = z.object({
  shareId: shareIdSchema,
  mode: z.nativeEnum(ScheduleImportMode),
})

export type ClassSlotInput = z.input<typeof classSlotSchema>
export type CommissionFields = z.infer<typeof commissionFieldsSchema>
export type CreateCommissionInput = z.input<typeof createCommissionInputSchema>
export type UpdateCommissionInput = z.input<typeof updateCommissionInputSchema>
export type DeleteCommissionInput = z.infer<typeof deleteCommissionInputSchema>
export type CreateCustomEntryInput = z.input<typeof createCustomEntryInputSchema>
export type UpdateCustomEntryInput = z.input<typeof updateCustomEntryInputSchema>
export type CreateShareInput = z.input<typeof createShareInputSchema>
export type ImportShareInput = z.infer<typeof importShareInputSchema>
