import { z } from "zod"
import { CLASS_DAY_SHORT_LABELS } from "@/lib/schedule/labels"
import { hasInternalOverlap } from "@/lib/schedule/overlaps"
import { slotsOverlap, toMinutes } from "@/lib/schedule/time"
import type { ClassSlot } from "@/lib/schedule/types"
import { MAX_CLASSROOM_LENGTH, MAX_COMMISSION_NAME_LENGTH, MAX_SLOTS_PER_ENTRY, timeSchema } from "@/lib/schedule/validation"
import { ClassDay, CommissionImportFormat, CommissionImportStatus, CommissionPeriod, CommissionShift, ImportIssueLevel } from "@/types/enums"

/*
 * Bulk import of official commissions (CSV or JSON, one row per weekly class).
 *
 * Rows with the same career, plan, subject number, commission name and period form one commission. Each commission is
 * matched against the catalog by (subject, name, period): new ones are created, existing ones are updated in place, so
 * students that already picked them see the new slots without losing their choice.
 */

export const MAX_IMPORT_CHARACTERS = 500_000
export const MAX_IMPORT_ROWS = 3_000
export const MAX_TERM_LENGTH = 60
export const MAX_SOURCE_LENGTH = 120
export const MAX_SOURCE_URL_LENGTH = 300

/** Columns of the CSV header (and keys of each JSON object), in the order the template lists them. */
export const IMPORT_COLUMNS: ReadonlyArray<string> = [
  "career",
  "plan",
  "subjectNumber",
  "subjectName",
  "commission",
  "shift",
  "period",
  "day",
  "start",
  "end",
  "classroom",
  "term",
  "source",
  "sourceUrl",
]

export type ImportIssue = {
  level: ImportIssueLevel
  /** 1-based line of the CSV file or position of the JSON object; null when the issue concerns a whole commission. */
  line: number | null
  message: string
}

/** Lower case, no accents, spaces and dashes as underscores: "Miércoles" → "miercoles", "Segundo cuatrimestre" → "segundo_cuatrimestre". */
function normalizeToken(value: unknown): unknown {
  if (typeof value !== "string") return value
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
}

/** Accent, case, punctuation and spacing insensitive form of a subject name, used to check the file names the right subject. */
export function normalizeSubjectName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

const emptyToNull = (value: unknown): unknown => (value === undefined || value === "" ? null : value)

const optionalText = (maxLength: number, message: string) =>
  z.preprocess(emptyToNull, z.string().trim().max(maxLength, message).nullable()).transform((value) => (value === null || value.length === 0 ? null : value))

const requiredText = (maxLength: number, missing: string, tooLong: string) => z.string({ required_error: missing }).trim().min(1, missing).max(maxLength, tooLong)

export const commissionImportRowSchema = z
  .object({
    career: requiredText(16, "Indicá la carrera (por ejemplo ISI)", "El código de carrera es demasiado largo").transform((value) => value.toUpperCase()),
    plan: z.coerce.string().pipe(requiredText(16, "Indicá el plan (por ejemplo 2023)", "El plan es demasiado largo")),
    subjectNumber: z.coerce
      .number({ invalid_type_error: "El número de materia debe ser un número" })
      .int("El número de materia debe ser un entero")
      .positive("El número de materia debe ser positivo"),
    subjectName: optionalText(200, "El nombre de la materia es demasiado largo"),
    commission: requiredText(MAX_COMMISSION_NAME_LENGTH, "Indicá el nombre de la comisión", `El nombre de la comisión no puede superar ${MAX_COMMISSION_NAME_LENGTH} caracteres`),
    shift: z.preprocess(normalizeToken, z.nativeEnum(CommissionShift, { errorMap: () => ({ message: "El turno debe ser manana, tarde o noche" }) })),
    period: z.preprocess(
      normalizeToken,
      z.nativeEnum(CommissionPeriod, { errorMap: () => ({ message: "El período debe ser anual, primer_cuatrimestre o segundo_cuatrimestre" }) }),
    ),
    day: z.preprocess(normalizeToken, z.nativeEnum(ClassDay, { errorMap: () => ({ message: "El día debe ser de lunes a sábado" }) })),
    start: timeSchema,
    end: timeSchema,
    classroom: optionalText(MAX_CLASSROOM_LENGTH, `El aula no puede superar ${MAX_CLASSROOM_LENGTH} caracteres`),
    term: requiredText(MAX_TERM_LENGTH, "Indicá el período lectivo (por ejemplo 2.º cuatrimestre 2026)", `El período lectivo no puede superar ${MAX_TERM_LENGTH} caracteres`),
    source: requiredText(MAX_SOURCE_LENGTH, "Indicá la fuente de los horarios", `La fuente no puede superar ${MAX_SOURCE_LENGTH} caracteres`),
    sourceUrl: z.preprocess(
      emptyToNull,
      z.string().trim().url("El enlace de la fuente no es válido").max(MAX_SOURCE_URL_LENGTH, "El enlace de la fuente es demasiado largo").nullable(),
    ),
  })
  .refine((row) => toMinutes(row.start) < toMinutes(row.end), { message: "La hora de fin debe ser posterior a la de inicio", path: ["end"] })

export type CommissionImportRow = z.infer<typeof commissionImportRowSchema>

/** A commission as the file describes it, before it is matched against the catalog. */
export type ImportedCommission = {
  key: string
  career: string
  plan: string
  subjectNumber: number
  subjectName: string | null
  name: string
  shift: CommissionShift
  period: CommissionPeriod
  term: string
  source: string
  sourceUrl: string | null
  slots: ClassSlot[]
  lines: number[]
}

export type CatalogSubject = { id: number; careerCode: string; plan: string; number: number; name: string }

export type CatalogCommission = {
  id: number
  subjectId: number
  name: string
  shift: CommissionShift
  period: CommissionPeriod
  slots: ClassSlot[]
  term: string | null
  source: string | null
  sourceUrl: string | null
}

export type CommissionImportItem = {
  key: string
  status: CommissionImportStatus
  existingId: number | null
  subjectId: number
  subjectName: string
  career: string
  plan: string
  name: string
  shift: CommissionShift
  period: CommissionPeriod
  term: string
  source: string
  sourceUrl: string | null
  slots: ClassSlot[]
  /** Human readable fields that differ from the catalog (empty for new and unchanged commissions). */
  changes: string[]
}

export type CommissionImportPlan = {
  format: CommissionImportFormat
  rowCount: number
  items: CommissionImportItem[]
  issues: ImportIssue[]
  counts: Record<CommissionImportStatus, number>
  /** True when there is at least one commission to write and no blocking error. */
  canApply: boolean
}

export class CommissionImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CommissionImportError"
  }
}

// ---------------------------------------------------------------------------
// Reading the file
// ---------------------------------------------------------------------------

export type RawImportRow = { line: number; values: Record<string, unknown> }

export function detectImportFormat(content: string): CommissionImportFormat {
  const first = content.trimStart().charAt(0)
  return first === "[" || first === "{" ? CommissionImportFormat.Json : CommissionImportFormat.Csv
}

/** RFC 4180 records: quoted fields may hold the delimiter, line breaks and doubled quotes. */
export function parseCsvRecords(content: string, delimiter: string): { line: number; fields: string[] }[] {
  const records: { line: number; fields: string[] }[] = []
  let fields: string[] = []
  let field = ""
  let inQuotes = false
  let line = 1
  let recordLine = 1
  const text = content.replace(/^\uFEFF/, "")
  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (inQuotes) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"'
        index++
      } else if (char === '"') {
        inQuotes = false
      } else {
        if (char === "\n") line++
        field += char
      }
      continue
    }
    if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      fields.push(field)
      field = ""
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index++
      fields.push(field)
      if (fields.some((value) => value.trim().length > 0)) records.push({ line: recordLine, fields })
      fields = []
      field = ""
      line++
      recordLine = line
    } else {
      field += char
    }
  }
  if (inQuotes) throw new CommissionImportError(`Hay comillas sin cerrar a partir de la línea ${recordLine}`)
  fields.push(field)
  if (fields.some((value) => value.trim().length > 0)) records.push({ line: recordLine, fields })
  return records
}

function readCsv(content: string): RawImportRow[] {
  const firstLine = content.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? ""
  const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ","
  const records = parseCsvRecords(content, delimiter)
  if (records.length === 0) throw new CommissionImportError("El archivo está vacío")
  const header = records[0].fields.map((name) => name.trim())
  const missing = IMPORT_COLUMNS.filter((column) => column !== "subjectName" && column !== "classroom" && column !== "sourceUrl" && !header.includes(column))
  if (missing.length > 0) throw new CommissionImportError(`Faltan columnas en el encabezado: ${missing.join(", ")}`)
  const rows: RawImportRow[] = []
  for (const record of records.slice(1)) {
    const values: Record<string, unknown> = {}
    header.forEach((name, index) => {
      values[name] = record.fields[index] ?? ""
    })
    rows.push({ line: record.line, values })
  }
  return rows
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readJson(content: string): RawImportRow[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new CommissionImportError("El JSON no es válido")
  }
  const list = isRecord(parsed) && Array.isArray(parsed.rows) ? parsed.rows : parsed
  if (!Array.isArray(list)) throw new CommissionImportError("El JSON debe ser una lista de filas o un objeto con la lista en rows")
  const rows: RawImportRow[] = []
  list.forEach((item, index) => {
    rows.push({ line: index + 1, values: isRecord(item) ? item : {} })
  })
  return rows
}

export function readImportRows(content: string): { format: CommissionImportFormat; rows: RawImportRow[] } {
  if (content.trim().length === 0) throw new CommissionImportError("Pegá o elegí un archivo con comisiones")
  if (content.length > MAX_IMPORT_CHARACTERS) throw new CommissionImportError("El archivo es demasiado grande (máximo 500 KB)")
  const format = detectImportFormat(content)
  const rows = format === CommissionImportFormat.Json ? readJson(content) : readCsv(content)
  if (rows.length === 0) throw new CommissionImportError("El archivo no tiene filas de comisiones")
  if (rows.length > MAX_IMPORT_ROWS) throw new CommissionImportError(`El archivo tiene más de ${MAX_IMPORT_ROWS} filas`)
  return { format, rows }
}

// ---------------------------------------------------------------------------
// Validation and grouping
// ---------------------------------------------------------------------------

function lineLabel(format: CommissionImportFormat, line: number): string {
  return format === CommissionImportFormat.Json ? `Fila ${line}` : `Línea ${line}`
}

export function validateImportRows(format: CommissionImportFormat, rows: ReadonlyArray<RawImportRow>): { rows: { line: number; row: CommissionImportRow }[]; issues: ImportIssue[] } {
  const valid: { line: number; row: CommissionImportRow }[] = []
  const issues: ImportIssue[] = []
  for (const raw of rows) {
    const result = commissionImportRowSchema.safeParse(raw.values)
    if (result.success) {
      valid.push({ line: raw.line, row: result.data })
      continue
    }
    const messages = [...new Set(result.error.issues.map((issue) => issue.message))]
    issues.push({ level: ImportIssueLevel.Error, line: raw.line, message: `${lineLabel(format, raw.line)}: ${messages.join(" · ")}` })
  }
  return { rows: valid, issues }
}

export function commissionKey(career: string, plan: string, subjectNumber: number, name: string, period: CommissionPeriod): string {
  return [career, plan, subjectNumber, name.toUpperCase(), period].join("|")
}

function sameSlot(a: ClassSlot, b: ClassSlot): boolean {
  return a.day === b.day && a.start === b.start && a.end === b.end && a.classroom === b.classroom
}

/** Day order first, then start time, so equal timetables compare equal whatever the row order of the file. */
export function sortSlots(slots: ReadonlyArray<ClassSlot>): ClassSlot[] {
  const dayOrder = Object.values(ClassDay)
  return [...slots].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day) || toMinutes(a.start) - toMinutes(b.start))
}

export function formatSlot(slot: ClassSlot): string {
  return `${CLASS_DAY_SHORT_LABELS[slot.day]} ${slot.start}–${slot.end}${slot.classroom ? ` (${slot.classroom})` : ""}`
}

/** Joins the rows of each commission and checks that they agree with each other. */
export function groupImportRows(format: CommissionImportFormat, rows: ReadonlyArray<{ line: number; row: CommissionImportRow }>): { commissions: ImportedCommission[]; issues: ImportIssue[] } {
  const byKey = new Map<string, ImportedCommission>()
  const issues: ImportIssue[] = []
  for (const { line, row } of rows) {
    const key = commissionKey(row.career, row.plan, row.subjectNumber, row.commission, row.period)
    const slot: ClassSlot = { day: row.day, start: row.start, end: row.end, classroom: row.classroom }
    const current = byKey.get(key)
    if (!current) {
      byKey.set(key, {
        key,
        career: row.career,
        plan: row.plan,
        subjectNumber: row.subjectNumber,
        subjectName: row.subjectName,
        name: row.commission,
        shift: row.shift,
        period: row.period,
        term: row.term,
        source: row.source,
        sourceUrl: row.sourceUrl,
        slots: [slot],
        lines: [line],
      })
      continue
    }
    const label = lineLabel(format, line)
    if (current.shift !== row.shift || current.term !== row.term || current.source !== row.source || current.sourceUrl !== row.sourceUrl) {
      issues.push({
        level: ImportIssueLevel.Error,
        line,
        message: `${label}: la comisión ${row.commission} de la materia ${row.subjectNumber} tiene otro turno, período lectivo o fuente que en sus filas anteriores`,
      })
      continue
    }
    if (current.slots.some((existing) => sameSlot(existing, slot))) {
      issues.push({ level: ImportIssueLevel.Warning, line, message: `${label}: fila repetida de ${row.commission} (${formatSlot(slot)}); se carga una sola vez` })
      continue
    }
    current.slots.push(slot)
    current.lines.push(line)
  }
  const commissions: ImportedCommission[] = []
  for (const commission of byKey.values()) {
    const where = `${commission.name} de la materia ${commission.subjectNumber} (${lineLabel(format, commission.lines[0]).toLowerCase()})`
    if (commission.slots.length > MAX_SLOTS_PER_ENTRY) {
      issues.push({ level: ImportIssueLevel.Error, line: commission.lines[0], message: `${where}: tiene más de ${MAX_SLOTS_PER_ENTRY} horarios` })
      continue
    }
    if (hasInternalOverlap(commission.slots)) {
      issues.push({ level: ImportIssueLevel.Error, line: commission.lines[0], message: `${where}: tiene horarios superpuestos entre sí` })
      continue
    }
    commissions.push({ ...commission, slots: sortSlots(commission.slots) })
  }
  return { commissions, issues }
}

// ---------------------------------------------------------------------------
// Matching against the catalog
// ---------------------------------------------------------------------------

function slotsEqual(a: ReadonlyArray<ClassSlot>, b: ReadonlyArray<ClassSlot>): boolean {
  const left = sortSlots(a)
  const right = sortSlots(b)
  if (left.length !== right.length) return false
  for (let index = 0; index < left.length; index++) {
    if (!sameSlot(left[index], right[index])) return false
  }
  return true
}

function describeChanges(existing: CatalogCommission, incoming: ImportedCommission): string[] {
  const changes: string[] = []
  if (!slotsEqual(existing.slots, incoming.slots)) {
    changes.push(`Horarios: ${sortSlots(existing.slots).map(formatSlot).join(" · ")} → ${incoming.slots.map(formatSlot).join(" · ")}`)
  }
  if (existing.shift !== incoming.shift) changes.push("Turno")
  if (existing.term !== incoming.term) changes.push(`Período lectivo: ${existing.term ?? "sin dato"} → ${incoming.term}`)
  if (existing.source !== incoming.source || existing.sourceUrl !== incoming.sourceUrl) changes.push("Fuente")
  return changes
}

function subjectKey(career: string, plan: string, number: number): string {
  return `${career.toUpperCase()}|${plan}|${number}`
}

/**
 * Commissions with the same name in one career and plan are the same group of students (for example 3K01), so their
 * classes should not overlap. A clash is reported as a warning: published timetables sometimes have them on purpose.
 */
function groupOverlapWarnings(items: ReadonlyArray<CommissionImportItem>): ImportIssue[] {
  const groups = new Map<string, CommissionImportItem[]>()
  for (const item of items) {
    const key = `${item.career}|${item.plan}|${item.name.toUpperCase()}`
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  const issues: ImportIssue[] = []
  for (const group of groups.values()) {
    for (let first = 0; first < group.length; first++) {
      for (let second = first + 1; second < group.length; second++) {
        const a = group[first]
        const b = group[second]
        for (const slotA of a.slots) {
          const clash = b.slots.find((slotB) => slotsOverlap(slotA, slotB))
          if (!clash) continue
          issues.push({
            level: ImportIssueLevel.Warning,
            line: null,
            message: `${a.name}: ${a.subjectName} (${formatSlot(slotA)}) se superpone con ${b.subjectName} (${formatSlot(clash)})`,
          })
          break
        }
      }
    }
  }
  return issues
}

export function planCommissionImport(
  format: CommissionImportFormat,
  rowCount: number,
  commissions: ReadonlyArray<ImportedCommission>,
  previousIssues: ReadonlyArray<ImportIssue>,
  catalog: { subjects: ReadonlyArray<CatalogSubject>; commissions: ReadonlyArray<CatalogCommission> },
): CommissionImportPlan {
  const subjects = new Map<string, CatalogSubject>()
  for (const subject of catalog.subjects) subjects.set(subjectKey(subject.careerCode, subject.plan, subject.number), subject)
  const existing = new Map<string, CatalogCommission>()
  for (const commission of catalog.commissions) existing.set(`${commission.subjectId}|${commission.name.toUpperCase()}|${commission.period}`, commission)

  const issues: ImportIssue[] = [...previousIssues]
  const items: CommissionImportItem[] = []
  for (const incoming of commissions) {
    const line = incoming.lines[0]
    const subject = subjects.get(subjectKey(incoming.career, incoming.plan, incoming.subjectNumber))
    if (!subject) {
      issues.push({
        level: ImportIssueLevel.Error,
        line,
        message: `${lineLabel(format, line)}: no existe la materia ${incoming.subjectNumber} en la carrera ${incoming.career} plan ${incoming.plan}`,
      })
      continue
    }
    if (incoming.subjectName && normalizeSubjectName(incoming.subjectName) !== normalizeSubjectName(subject.name)) {
      issues.push({
        level: ImportIssueLevel.Error,
        line,
        message: `${lineLabel(format, line)}: la materia ${incoming.subjectNumber} de ${incoming.career} es ${subject.name}, no ${incoming.subjectName}`,
      })
      continue
    }
    const current = existing.get(`${subject.id}|${incoming.name.toUpperCase()}|${incoming.period}`) ?? null
    const changes = current ? describeChanges(current, incoming) : []
    const status = !current ? CommissionImportStatus.Create : changes.length > 0 ? CommissionImportStatus.Update : CommissionImportStatus.Unchanged
    items.push({
      key: incoming.key,
      status,
      existingId: current?.id ?? null,
      subjectId: subject.id,
      subjectName: subject.name,
      career: incoming.career,
      plan: incoming.plan,
      // An update keeps the catalog spelling of the name, which students already see.
      name: current?.name ?? incoming.name,
      shift: incoming.shift,
      period: incoming.period,
      term: incoming.term,
      source: incoming.source,
      sourceUrl: incoming.sourceUrl,
      slots: incoming.slots,
      changes,
    })
  }
  issues.push(...groupOverlapWarnings(items))

  const counts: Record<CommissionImportStatus, number> = {
    [CommissionImportStatus.Create]: 0,
    [CommissionImportStatus.Update]: 0,
    [CommissionImportStatus.Unchanged]: 0,
  }
  for (const item of items) counts[item.status]++
  const hasErrors = issues.some((issue) => issue.level === ImportIssueLevel.Error)
  const pending = counts[CommissionImportStatus.Create] + counts[CommissionImportStatus.Update]
  return { format, rowCount, items, issues, counts, canApply: !hasErrors && pending > 0 }
}

/** Whole pipeline for a pasted or uploaded file; throws `CommissionImportError` when the file cannot be read at all. */
export function buildCommissionImportPlan(
  content: string,
  catalog: { subjects: ReadonlyArray<CatalogSubject>; commissions: ReadonlyArray<CatalogCommission> },
): CommissionImportPlan {
  const { format, rows } = readImportRows(content)
  const validated = validateImportRows(format, rows)
  const grouped = groupImportRows(format, validated.rows)
  return planCommissionImport(format, rows.length, grouped.commissions, [...validated.issues, ...grouped.issues], catalog)
}
