import { z } from "zod"
import { SYSACAD_PAYLOAD_VERSION, SysacadRowStatus, SysacadSource, type SysacadPayload } from "./types"

/** A career has under 60 subjects; the cap only stops absurd payloads. */
export const MAX_SYSACAD_ROWS = 200

const yearSchema = z.number().int().min(1900).max(2100)

export const sysacadRowSchema = z
  .object({
    year: z.number().int().min(0).max(12),
    name: z.string().trim().min(1).max(160),
    plan: z.string().trim().max(10),
    status: z.nativeEnum(SysacadRowStatus),
    grade: z.number().min(1).max(10).optional(),
    approvedYear: yearSchema.optional(),
    regularYear: yearSchema.optional(),
    term: z.string().trim().max(10).optional(),
    commission: z.string().trim().max(20).optional(),
    raw: z.string().trim().max(200).optional(),
  })
  .strip()

export const sysacadPayloadSchema = z.object({
  v: z.literal(SYSACAD_PAYLOAD_VERSION, { errorMap: () => ({ message: "La versión de la extensión no es compatible. Actualizala." }) }),
  source: z.nativeEnum(SysacadSource),
  capturedAt: z.string().datetime(),
  plan: z.string().trim().max(10),
  rows: z.array(sysacadRowSchema).min(1, "SysAcad no trajo ninguna materia.").max(MAX_SYSACAD_ROWS),
})

/** Validates untrusted JSON (a decoded fragment) into a payload. */
export function parseSysacadPayload(input: unknown): SysacadPayload {
  return sysacadPayloadSchema.parse(input)
}
