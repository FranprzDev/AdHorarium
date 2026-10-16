import { PGlite } from "@electric-sql/pglite"
import { asc, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import * as schema from "@/db/schema"
import {
  countCommissionEntries,
  createCommission,
  createScheduleShare,
  deleteCommission,
  deleteScheduleEntry,
  getSharedSchedule,
  importScheduleShare,
  listCareerCommissions,
  listScheduleEntries,
  listSubjectCommissions,
  pickCommission,
  saveCustomEntry,
  updateCommission,
  updateCustomEntry,
} from "@/db/queries/schedule"
import { seedDatabase } from "@/db/seed/seed-database"
import type { CommissionFields } from "@/lib/schedule/validation"
import { CareerCode, ClassDay, CommissionPeriod, CommissionShift, ScheduleEntryKind, ScheduleImportMode } from "@/types/enums"

const client = new PGlite()
const db = drizzle({ client, schema })
const STUDENT = "student-a"
const FRIEND = "student-b"
const NO_CAREER = "student-c"
let careerId = 0
let otherCareerSubjectId = 0
let subjectIds: number[] = []

function fields(name: string, day: ClassDay, start: string, end: string): CommissionFields {
  return { name, shift: CommissionShift.Manana, period: CommissionPeriod.Anual, slots: [{ day, start, end, classroom: "Aula 1" }] }
}

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" })
  await seedDatabase(db)
  const [career] = await db.select().from(schema.careers).where(eq(schema.careers.code, CareerCode.Sistemas))
  const [otherCareer] = await db.select().from(schema.careers).where(eq(schema.careers.code, CareerCode.Civil))
  careerId = career.id
  const rows = await db
    .select({ id: schema.subjects.id })
    .from(schema.subjects)
    .where(eq(schema.subjects.careerId, careerId))
    .orderBy(asc(schema.subjects.level), asc(schema.subjects.number))
  subjectIds = rows.map((row) => row.id)
  const [other] = await db.select({ id: schema.subjects.id }).from(schema.subjects).where(eq(schema.subjects.careerId, otherCareer.id)).limit(1)
  otherCareerSubjectId = other.id
  await db.insert(schema.users).values([
    { id: STUDENT, email: "a@example.com", name: "A", careerId },
    { id: FRIEND, email: "b@example.com", name: "B", careerId },
    { id: NO_CAREER, email: "c@example.com", name: "C" },
  ])
}, 60_000)

afterAll(async () => {
  await client.close()
})

describe("commission catalog", () => {
  it("creates, lists and rejects duplicate names per subject", async () => {
    const id = await createCommission(db, subjectIds[0], fields("Comisión de ejemplo 1K1", ClassDay.Lunes, "08:00", "10:00"))
    await createCommission(db, subjectIds[0], fields("Comisión de ejemplo 1K2", ClassDay.Martes, "18:00", "20:00"))
    await expect(createCommission(db, subjectIds[0], fields("Comisión de ejemplo 1K1", ClassDay.Lunes, "08:00", "10:00"))).rejects.toThrow(
      "ya tiene una comisión",
    )
    const listed = await listSubjectCommissions(db, subjectIds[0])
    expect(listed.map((commission) => commission.name)).toEqual(["Comisión de ejemplo 1K1", "Comisión de ejemplo 1K2"])
    expect(listed[0]).toMatchObject({ id, entryCount: 0, slots: [{ day: ClassDay.Lunes, start: "08:00", end: "10:00", classroom: "Aula 1" }] })
    expect((await listCareerCommissions(db, careerId)).length).toBe(2)
  })
})

describe("student timetable", () => {
  it("references catalog commissions live: an admin edit is reflected in the timetable", async () => {
    const [commission] = await listSubjectCommissions(db, subjectIds[0])
    await pickCommission(db, STUDENT, commission.id)
    await updateCommission(db, commission.id, fields("Comisión de ejemplo 1K1", ClassDay.Miercoles, "09:00", "11:00"))
    const [entry] = await listScheduleEntries(db, STUDENT, careerId)
    expect(entry).toMatchObject({ kind: ScheduleEntryKind.Commission, commissionId: commission.id, label: "Comisión de ejemplo 1K1" })
    expect(entry.slots).toEqual([{ day: ClassDay.Miercoles, start: "09:00", end: "11:00", classroom: "Aula 1" }])
    expect(await countCommissionEntries(db, commission.id)).toBe(1)
  })

  it("keeps one entry per subject: picking another commission replaces the previous one", async () => {
    const [, second] = await listSubjectCommissions(db, subjectIds[0])
    await pickCommission(db, STUDENT, second.id)
    const entries = await listScheduleEntries(db, STUDENT, careerId)
    expect(entries).toHaveLength(1)
    expect(entries[0].commissionId).toBe(second.id)
  })

  it("saves and edits custom entries, and refuses subjects of another career or users without career", async () => {
    await saveCustomEntry(db, STUDENT, subjectIds[1], "1K4", [{ day: ClassDay.Viernes, start: "14:00", end: "16:00", classroom: null }])
    const custom = (await listScheduleEntries(db, STUDENT, careerId)).find((entry) => entry.subjectId === subjectIds[1])
    expect(custom).toMatchObject({ kind: ScheduleEntryKind.Custom, label: "1K4", commissionId: null, shift: null })
    await updateCustomEntry(db, STUDENT, custom!.id, "1K5", [{ day: ClassDay.Viernes, start: "15:00", end: "17:00", classroom: "Lab" }])
    const edited = (await listScheduleEntries(db, STUDENT, careerId)).find((entry) => entry.id === custom!.id)
    expect(edited?.label).toBe("1K5")
    await expect(updateCustomEntry(db, FRIEND, custom!.id, "x", edited!.slots)).rejects.toThrow("no está en tu horario")
    await expect(saveCustomEntry(db, STUDENT, otherCareerSubjectId, "X", edited!.slots)).rejects.toThrow("no pertenece a tu carrera")
    await expect(saveCustomEntry(db, NO_CAREER, subjectIds[1], "X", edited!.slots)).rejects.toThrow("Elegí tu carrera")
  })

  it("only deletes the owner's entries", async () => {
    await saveCustomEntry(db, STUDENT, subjectIds[2], "Borrar", [{ day: ClassDay.Lunes, start: "20:00", end: "21:00", classroom: null }])
    const entry = (await listScheduleEntries(db, STUDENT, careerId)).find((candidate) => candidate.subjectId === subjectIds[2])!
    await expect(deleteScheduleEntry(db, FRIEND, entry.id)).rejects.toThrow()
    await deleteScheduleEntry(db, STUDENT, entry.id)
    expect((await listScheduleEntries(db, STUDENT, careerId)).some((candidate) => candidate.id === entry.id)).toBe(false)
  })
})

describe("sharing and import", () => {
  let shareId = ""

  it("creates a share that resolves commissions live and contains no personal data", async () => {
    shareId = await createScheduleShare(db, STUDENT, "Ana")
    const [row] = await db.select().from(schema.scheduleShares).where(eq(schema.scheduleShares.id, shareId))
    expect(JSON.stringify(row.entries)).not.toContain("example.com")
    const shared = await getSharedSchedule(db, shareId)
    expect(shared).toMatchObject({ displayName: "Ana", careerId, unavailableCount: 0 })
    expect(shared?.entries.map((entry) => entry.kind)).toEqual([ScheduleEntryKind.Commission, ScheduleEntryKind.Custom])
    expect(await getSharedSchedule(db, "A".repeat(22))).toBeNull()
    await expect(createScheduleShare(db, NO_CAREER, null)).rejects.toThrow("Elegí tu carrera")
  })

  it("imports by merge without touching existing subjects, then by replace", async () => {
    await saveCustomEntry(db, FRIEND, subjectIds[1], "Mía", [{ day: ClassDay.Sabado, start: "09:00", end: "12:00", classroom: null }])
    const merged = await importScheduleShare(db, FRIEND, { shareId, mode: ScheduleImportMode.Merge })
    expect(merged).toMatchObject({ skippedExisting: 1 })
    expect(merged.toInsert).toHaveLength(1)
    let friendEntries = await listScheduleEntries(db, FRIEND, careerId)
    expect(friendEntries.find((entry) => entry.subjectId === subjectIds[1])?.label).toBe("Mía")
    expect(friendEntries.find((entry) => entry.subjectId === subjectIds[0])?.kind).toBe(ScheduleEntryKind.Commission)

    await importScheduleShare(db, FRIEND, { shareId, mode: ScheduleImportMode.Replace })
    friendEntries = await listScheduleEntries(db, FRIEND, careerId)
    expect(friendEntries.find((entry) => entry.subjectId === subjectIds[1])?.label).toBe("1K5")
    expect(friendEntries).toHaveLength(2)
  })

  it("refuses to delete a used commission unless its entries become custom ones, and shares then skip it", async () => {
    const [, second] = await listSubjectCommissions(db, subjectIds[0])
    expect(second.entryCount).toBe(2)
    await expect(deleteCommission(db, { commissionId: second.id, detachEntries: false })).rejects.toThrow("está en el horario de 2 estudiantes")
    expect(await deleteCommission(db, { commissionId: second.id, detachEntries: true })).toBe(2)
    const [entry] = (await listScheduleEntries(db, STUDENT, careerId)).filter((candidate) => candidate.subjectId === subjectIds[0])
    expect(entry).toMatchObject({ kind: ScheduleEntryKind.Custom, commissionId: null, label: "Comisión de ejemplo 1K2" })
    expect(entry.slots).toEqual([{ day: ClassDay.Martes, start: "18:00", end: "20:00", classroom: "Aula 1" }])
    const shared = await getSharedSchedule(db, shareId)
    expect(shared?.unavailableCount).toBe(1)
    expect(shared?.entries).toHaveLength(1)
  })
})
