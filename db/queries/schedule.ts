import { and, asc, count, eq, inArray, ne } from "drizzle-orm"
import type { AppDatabase } from "@/db/client"
import { AdminRuleError } from "@/db/queries/admin"
import { careers, commissions, scheduleEntries, scheduleShares, subjects, users } from "@/db/schema"
import { createShareId, planImport, toSharedEntries, type ImportPlan } from "@/lib/schedule/sharing"
import type { AdminCommission, ClassSlot, Commission, ScheduleEntry, SharedEntry, SharedSchedule } from "@/lib/schedule/types"
import {
  sharedEntriesSchema,
  type CommissionFields,
  type DeleteCommissionInput,
  type ImportShareInput,
} from "@/lib/schedule/validation"
import { ScheduleEntryKind } from "@/types/enums"

/** A rule of the student's timetable was broken; the message is safe to show to the student. */
export class ScheduleRuleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ScheduleRuleError"
  }
}

const commissionColumns = {
  id: commissions.id,
  subjectId: commissions.subjectId,
  name: commissions.name,
  shift: commissions.shift,
  period: commissions.period,
  slots: commissions.slots,
}

// ---------------------------------------------------------------------------
// Admin catalog
// ---------------------------------------------------------------------------

export async function listSubjectCommissions(db: AppDatabase, subjectId: number): Promise<AdminCommission[]> {
  const rows = await db
    .select({ ...commissionColumns, entryCount: count(scheduleEntries.id) })
    .from(commissions)
    .leftJoin(scheduleEntries, eq(scheduleEntries.commissionId, commissions.id))
    .where(eq(commissions.subjectId, subjectId))
    .groupBy(commissions.id)
    .orderBy(asc(commissions.name))
  return rows.map((row) => ({ ...row, entryCount: Number(row.entryCount) }))
}

async function assertSubjectExists(db: AppDatabase, subjectId: number): Promise<void> {
  const [subject] = await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.id, subjectId)).limit(1)
  if (!subject) throw new AdminRuleError("La materia no existe")
}

async function assertCommissionNameAvailable(db: AppDatabase, subjectId: number, name: string, exceptId: number | null): Promise<void> {
  const conditions = [eq(commissions.subjectId, subjectId), eq(commissions.name, name)]
  if (exceptId !== null) conditions.push(ne(commissions.id, exceptId))
  const [taken] = await db.select({ id: commissions.id }).from(commissions).where(and(...conditions)).limit(1)
  if (taken) throw new AdminRuleError(`La materia ya tiene una comisión llamada ${name}`)
}

async function getCommissionOrThrow(db: AppDatabase, commissionId: number): Promise<Commission> {
  const [commission] = await db.select(commissionColumns).from(commissions).where(eq(commissions.id, commissionId)).limit(1)
  if (!commission) throw new AdminRuleError("La comisión no existe")
  return commission
}

export async function createCommission(db: AppDatabase, subjectId: number, fields: CommissionFields): Promise<number> {
  await assertSubjectExists(db, subjectId)
  await assertCommissionNameAvailable(db, subjectId, fields.name, null)
  const [created] = await db
    .insert(commissions)
    .values({ subjectId, name: fields.name, shift: fields.shift, period: fields.period, slots: fields.slots })
    .returning({ id: commissions.id })
  return created.id
}

/** Students that picked this commission see the new slots right away: entries reference it by id. */
export async function updateCommission(db: AppDatabase, commissionId: number, fields: CommissionFields): Promise<void> {
  const current = await getCommissionOrThrow(db, commissionId)
  await assertCommissionNameAvailable(db, current.subjectId, fields.name, commissionId)
  await db
    .update(commissions)
    .set({ name: fields.name, shift: fields.shift, period: fields.period, slots: fields.slots })
    .where(eq(commissions.id, commissionId))
}

export async function countCommissionEntries(db: AppDatabase, commissionId: number): Promise<number> {
  const [row] = await db.select({ total: count() }).from(scheduleEntries).where(eq(scheduleEntries.commissionId, commissionId))
  return Number(row?.total ?? 0)
}

/**
 * Deletes a commission. When students use it, deletion is refused unless `detachEntries` is set:
 * then their entries are first turned into custom entries with the commission's last slots, so no
 * timetable silently loses a subject. Converting first keeps a retry safe if the delete fails.
 */
export async function deleteCommission(db: AppDatabase, { commissionId, detachEntries }: DeleteCommissionInput): Promise<number> {
  const commission = await getCommissionOrThrow(db, commissionId)
  const used = await countCommissionEntries(db, commissionId)
  if (used > 0 && !detachEntries) {
    throw new AdminRuleError(
      `La comisión está en el horario de ${used} ${used === 1 ? "estudiante" : "estudiantes"}. Confirmá que sus horarios pasen a ser manuales para eliminarla.`,
    )
  }
  if (used > 0) {
    await db
      .update(scheduleEntries)
      .set({ kind: ScheduleEntryKind.Custom, commissionId: null, label: commission.name, slots: commission.slots })
      .where(eq(scheduleEntries.commissionId, commissionId))
  }
  await db.delete(commissions).where(eq(commissions.id, commissionId))
  return used
}

// ---------------------------------------------------------------------------
// Student timetable
// ---------------------------------------------------------------------------

/** Every commission of the career's subjects, for the builder and the assistant. */
export async function listCareerCommissions(db: AppDatabase, careerId: number): Promise<Commission[]> {
  return db
    .select(commissionColumns)
    .from(commissions)
    .innerJoin(subjects, eq(commissions.subjectId, subjects.id))
    .where(eq(subjects.careerId, careerId))
    .orderBy(asc(subjects.level), asc(subjects.number), asc(commissions.name))
}

type EntryRow = {
  id: number
  kind: ScheduleEntryKind
  subjectId: number
  subjectName: string
  subjectLevel: number
  commissionId: number | null
  label: string | null
  slots: ClassSlot[] | null
  commissionName: string | null
  commissionShift: Commission["shift"] | null
  commissionPeriod: Commission["period"] | null
  commissionSlots: ClassSlot[] | null
}

function toScheduleEntry(row: EntryRow): ScheduleEntry {
  const isCommission = row.kind === ScheduleEntryKind.Commission
  return {
    id: row.id,
    kind: row.kind,
    subjectId: row.subjectId,
    subjectName: row.subjectName,
    subjectLevel: row.subjectLevel,
    commissionId: row.commissionId,
    label: (isCommission ? row.commissionName : row.label) ?? "",
    shift: isCommission ? row.commissionShift : null,
    period: isCommission ? row.commissionPeriod : null,
    slots: (isCommission ? row.commissionSlots : row.slots) ?? [],
  }
}

/** The student's timetable for one career, with catalog commissions resolved live. */
export async function listScheduleEntries(db: AppDatabase, userId: string, careerId: number): Promise<ScheduleEntry[]> {
  const rows = await db
    .select({
      id: scheduleEntries.id,
      kind: scheduleEntries.kind,
      subjectId: scheduleEntries.subjectId,
      subjectName: subjects.name,
      subjectLevel: subjects.level,
      commissionId: scheduleEntries.commissionId,
      label: scheduleEntries.label,
      slots: scheduleEntries.slots,
      commissionName: commissions.name,
      commissionShift: commissions.shift,
      commissionPeriod: commissions.period,
      commissionSlots: commissions.slots,
    })
    .from(scheduleEntries)
    .innerJoin(subjects, eq(scheduleEntries.subjectId, subjects.id))
    .leftJoin(commissions, eq(scheduleEntries.commissionId, commissions.id))
    .where(and(eq(scheduleEntries.userId, userId), eq(subjects.careerId, careerId)))
    .orderBy(asc(subjects.level), asc(subjects.number))
  return rows.map(toScheduleEntry)
}

async function requireUserCareerId(db: AppDatabase, userId: string): Promise<number> {
  const [user] = await db.select({ careerId: users.careerId }).from(users).where(eq(users.id, userId)).limit(1)
  if (!user?.careerId) throw new ScheduleRuleError("Elegí tu carrera antes de armar el horario")
  return user.careerId
}

async function assertSubjectInCareer(db: AppDatabase, subjectId: number, careerId: number): Promise<void> {
  const [subject] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(eq(subjects.id, subjectId), eq(subjects.careerId, careerId)))
    .limit(1)
  if (!subject) throw new ScheduleRuleError("La materia no pertenece a tu carrera")
}

/** Adds the commission's subject to the timetable, replacing any previous choice for that subject. */
export async function pickCommission(db: AppDatabase, userId: string, commissionId: number): Promise<void> {
  const careerId = await requireUserCareerId(db, userId)
  const [commission] = await db.select({ subjectId: commissions.subjectId }).from(commissions).where(eq(commissions.id, commissionId)).limit(1)
  if (!commission) throw new ScheduleRuleError("La comisión ya no existe")
  await assertSubjectInCareer(db, commission.subjectId, careerId)
  await db
    .insert(scheduleEntries)
    .values({ userId, subjectId: commission.subjectId, kind: ScheduleEntryKind.Commission, commissionId })
    .onConflictDoUpdate({
      target: [scheduleEntries.userId, scheduleEntries.subjectId],
      set: { kind: ScheduleEntryKind.Commission, commissionId, label: null, slots: null, updatedAt: new Date() },
    })
}

/** Custom slots for a subject, replacing any previous choice for that subject. */
export async function saveCustomEntry(db: AppDatabase, userId: string, subjectId: number, label: string, slots: ClassSlot[]): Promise<void> {
  const careerId = await requireUserCareerId(db, userId)
  await assertSubjectInCareer(db, subjectId, careerId)
  await db
    .insert(scheduleEntries)
    .values({ userId, subjectId, kind: ScheduleEntryKind.Custom, label, slots })
    .onConflictDoUpdate({
      target: [scheduleEntries.userId, scheduleEntries.subjectId],
      set: { kind: ScheduleEntryKind.Custom, commissionId: null, label, slots, updatedAt: new Date() },
    })
}

export async function updateCustomEntry(db: AppDatabase, userId: string, entryId: number, label: string, slots: ClassSlot[]): Promise<void> {
  const [updated] = await db
    .update(scheduleEntries)
    .set({ label, slots })
    .where(and(eq(scheduleEntries.id, entryId), eq(scheduleEntries.userId, userId), eq(scheduleEntries.kind, ScheduleEntryKind.Custom)))
    .returning({ id: scheduleEntries.id })
  if (!updated) throw new ScheduleRuleError("La materia no está en tu horario")
}

export async function deleteScheduleEntry(db: AppDatabase, userId: string, entryId: number): Promise<void> {
  const [deleted] = await db
    .delete(scheduleEntries)
    .where(and(eq(scheduleEntries.id, entryId), eq(scheduleEntries.userId, userId)))
    .returning({ id: scheduleEntries.id })
  if (!deleted) throw new ScheduleRuleError("La materia no está en tu horario")
}

// ---------------------------------------------------------------------------
// Sharing
// ---------------------------------------------------------------------------

/** Stores a snapshot of the student's timetable and returns its unguessable id. */
export async function createScheduleShare(db: AppDatabase, userId: string, displayName: string | null): Promise<string> {
  const careerId = await requireUserCareerId(db, userId)
  const entries = await listScheduleEntries(db, userId, careerId)
  if (entries.length === 0) throw new ScheduleRuleError("Agregá al menos una materia antes de compartir tu horario")
  const id = createShareId()
  await db.insert(scheduleShares).values({ id, userId, careerId, displayName, entries: toSharedEntries(entries) })
  return id
}

async function loadShare(db: AppDatabase, shareId: string) {
  const [share] = await db
    .select({
      id: scheduleShares.id,
      displayName: scheduleShares.displayName,
      careerId: scheduleShares.careerId,
      careerName: careers.name,
      createdAt: scheduleShares.createdAt,
      entries: scheduleShares.entries,
    })
    .from(scheduleShares)
    .innerJoin(careers, eq(scheduleShares.careerId, careers.id))
    .where(eq(scheduleShares.id, shareId))
    .limit(1)
  if (!share) return null
  return { ...share, entries: sharedEntriesSchema.parse(share.entries) }
}

async function loadCommissionsById(db: AppDatabase, ids: ReadonlyArray<number>): Promise<Map<number, Commission>> {
  const byId = new Map<number, Commission>()
  if (ids.length === 0) return byId
  const rows = await db.select(commissionColumns).from(commissions).where(inArray(commissions.id, [...ids]))
  for (const row of rows) byId.set(row.id, row)
  return byId
}

function commissionIdsOf(entries: ReadonlyArray<SharedEntry>): number[] {
  const ids: number[] = []
  for (const entry of entries) if (entry.kind === ScheduleEntryKind.Commission) ids.push(entry.commissionId)
  return ids
}

/** Public view of a share with commissions resolved live; null when the link does not exist. */
export async function getSharedSchedule(db: AppDatabase, shareId: string): Promise<SharedSchedule | null> {
  const share = await loadShare(db, shareId)
  if (!share) return null
  const subjectIds = [...new Set(share.entries.map((entry) => entry.subjectId))]
  const subjectRows =
    subjectIds.length === 0
      ? []
      : await db.select({ id: subjects.id, name: subjects.name, level: subjects.level }).from(subjects).where(inArray(subjects.id, subjectIds))
  const subjectById = new Map(subjectRows.map((row) => [row.id, row]))
  const commissionById = await loadCommissionsById(db, commissionIdsOf(share.entries))

  const entries: ScheduleEntry[] = []
  let unavailableCount = 0
  share.entries.forEach((entry, index) => {
    const subject = subjectById.get(entry.subjectId)
    if (!subject) {
      unavailableCount++
      return
    }
    const base = { id: index + 1, subjectId: subject.id, subjectName: subject.name, subjectLevel: subject.level }
    if (entry.kind === ScheduleEntryKind.Custom) {
      entries.push({ ...base, kind: entry.kind, commissionId: null, label: entry.label, shift: null, period: null, slots: entry.slots })
      return
    }
    const commission = commissionById.get(entry.commissionId)
    if (!commission || commission.subjectId !== entry.subjectId) {
      unavailableCount++
      return
    }
    entries.push({
      ...base,
      kind: entry.kind,
      commissionId: commission.id,
      label: commission.name,
      shift: commission.shift,
      period: commission.period,
      slots: commission.slots,
    })
  })
  return {
    id: share.id,
    displayName: share.displayName,
    careerId: share.careerId,
    careerName: share.careerName,
    createdAt: share.createdAt,
    entries,
    unavailableCount,
  }
}

/** Copies a shared timetable into the student's own one (merge or replace). */
export async function importScheduleShare(db: AppDatabase, userId: string, { shareId, mode }: ImportShareInput): Promise<ImportPlan> {
  const share = await loadShare(db, shareId)
  if (!share) throw new ScheduleRuleError("El enlace no existe o fue eliminado")
  const careerId = await requireUserCareerId(db, userId)

  const [current, careerSubjects, commissionById] = await Promise.all([
    listScheduleEntries(db, userId, careerId),
    db.select({ id: subjects.id }).from(subjects).where(eq(subjects.careerId, careerId)),
    loadCommissionsById(db, commissionIdsOf(share.entries)),
  ])
  const commissionSubjects = new Map<number, number>()
  for (const commission of commissionById.values()) commissionSubjects.set(commission.id, commission.subjectId)

  const plan = planImport({
    mode,
    incoming: share.entries,
    currentSubjectIds: new Set(current.map((entry) => entry.subjectId)),
    careerSubjectIds: new Set(careerSubjects.map((subject) => subject.id)),
    commissionSubjects,
  })
  if (plan.toInsert.length === 0) return plan

  if (plan.replaceAll && current.length > 0) {
    await db.delete(scheduleEntries).where(inArray(scheduleEntries.id, current.map((entry) => entry.id)))
  }
  if (plan.toInsert.length > 0) {
    await db
      .insert(scheduleEntries)
      .values(
        plan.toInsert.map((entry) =>
          entry.kind === ScheduleEntryKind.Commission
            ? { userId, subjectId: entry.subjectId, kind: entry.kind, commissionId: entry.commissionId }
            : { userId, subjectId: entry.subjectId, kind: entry.kind, label: entry.label, slots: entry.slots },
        ),
      )
      .onConflictDoNothing({ target: [scheduleEntries.userId, scheduleEntries.subjectId] })
  }
  return plan
}
