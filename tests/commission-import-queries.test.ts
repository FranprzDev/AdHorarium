import { PGlite } from "@electric-sql/pglite"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import * as schema from "@/db/schema"
import { applyCommissionImport, previewCommissionImport } from "@/db/queries/commission-import"
import { createCommission, listCareerCommissions, listScheduleEntries, pickCommission } from "@/db/queries/schedule"
import { seedDatabase } from "@/db/seed/seed-database"
import { IMPORT_COLUMNS } from "@/lib/schedule/commission-import"
import { CareerCode, ClassDay, CommissionImportStatus, CommissionPeriod, CommissionShift } from "@/types/enums"

const client = new PGlite()
const db = drizzle({ client, schema })
const STUDENT = "student-import"
const IMPORTED_AT = new Date("2026-10-16T12:00:00Z")
let careerId = 0

function file(rows: ReadonlyArray<string>): string {
  return [IMPORT_COLUMNS.join(","), ...rows].join("\n")
}

const SOURCE = "Departamento de Sistemas UTN-FRT,https://sistemasfrtutn.ar/horarios/"
const AM2_MONDAY = `ISI,2023,9,Análisis Matemático II,2K01,manana,anual,lunes,08:00,09:30,212,2.º cuatrimestre 2026,${SOURCE}`
const AM2_THURSDAY = `ISI,2023,9,Análisis Matemático II,2K01,manana,anual,jueves,10:15,12:30,212,2.º cuatrimestre 2026,${SOURCE}`
const AM2_FRIDAY = `ISI,2023,9,Análisis Matemático II,2K01,manana,anual,viernes,10:15,12:30,212,2.º cuatrimestre 2026,${SOURCE}`
const PHYSICS = `ISI,2023,13,Física II,2K01,manana,anual,miercoles,08:00,10:15,212,2.º cuatrimestre 2026,${SOURCE}`

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" })
  await seedDatabase(db)
  const [career] = await db.select().from(schema.careers).where(eq(schema.careers.code, CareerCode.Sistemas))
  careerId = career.id
  await db.insert(schema.users).values({ id: STUDENT, email: "import@example.com", name: "Import", careerId })
}, 60_000)

afterAll(async () => {
  await client.close()
})

describe("commission import against the database", () => {
  it("creates the commissions of a file with their source", async () => {
    const preview = await previewCommissionImport(db, file([AM2_MONDAY, AM2_THURSDAY, PHYSICS]))
    expect(preview.counts[CommissionImportStatus.Create]).toBe(2)
    expect(await listCareerCommissions(db, careerId)).toEqual([])

    expect(await applyCommissionImport(db, file([AM2_MONDAY, AM2_THURSDAY, PHYSICS]), IMPORTED_AT)).toEqual({ created: 2, updated: 0, unchanged: 0 })
    const listed = await listCareerCommissions(db, careerId)
    expect(listed).toHaveLength(2)
    expect(listed[0]).toMatchObject({
      name: "2K01",
      shift: CommissionShift.Manana,
      period: CommissionPeriod.Anual,
      term: "2.º cuatrimestre 2026",
      source: "Departamento de Sistemas UTN-FRT",
      sourceUrl: "https://sistemasfrtutn.ar/horarios/",
      sourceUpdatedAt: IMPORTED_AT,
      slots: [
        { day: ClassDay.Lunes, start: "08:00", end: "09:30", classroom: "212" },
        { day: ClassDay.Jueves, start: "10:15", end: "12:30", classroom: "212" },
      ],
    })
  })

  it("is idempotent: the same file again changes nothing and cannot be applied", async () => {
    const preview = await previewCommissionImport(db, file([AM2_MONDAY, AM2_THURSDAY, PHYSICS]))
    expect(preview.counts).toEqual({ [CommissionImportStatus.Create]: 0, [CommissionImportStatus.Update]: 0, [CommissionImportStatus.Unchanged]: 2 })
    await expect(applyCommissionImport(db, file([AM2_MONDAY, AM2_THURSDAY, PHYSICS]), IMPORTED_AT)).rejects.toThrow("No hay comisiones nuevas")
  })

  it("updates a commission in place, so a student's choice follows the new slots", async () => {
    const [amII] = await listCareerCommissions(db, careerId)
    await pickCommission(db, STUDENT, amII.id)
    const later = new Date("2026-10-20T12:00:00Z")
    expect(await applyCommissionImport(db, file([AM2_MONDAY, AM2_FRIDAY, PHYSICS]), later)).toEqual({ created: 0, updated: 1, unchanged: 1 })
    const [entry] = await listScheduleEntries(db, STUDENT, careerId)
    expect(entry.commissionId).toBe(amII.id)
    expect(entry.slots.map((slot) => slot.day)).toEqual([ClassDay.Lunes, ClassDay.Viernes])
    const [row] = await db
      .select({ sourceUpdatedAt: schema.commissions.sourceUpdatedAt })
      .from(schema.commissions)
      .where(eq(schema.commissions.id, amII.id))
    expect(row.sourceUpdatedAt).toEqual(later)
  })

  it("refuses a file with errors and writes nothing", async () => {
    const before = await listCareerCommissions(db, careerId)
    await expect(applyCommissionImport(db, file([AM2_MONDAY.replace("lunes", "domingo"), PHYSICS.replace("08:00", "07:00")]), IMPORTED_AT)).rejects.toThrow(
      "El día debe ser de lunes a sábado",
    )
    expect(await listCareerCommissions(db, careerId)).toEqual(before)
  })

  it("keeps hand-made commissions apart: the same name is allowed in another period only", async () => {
    const subjectId = (await listCareerCommissions(db, careerId))[0].subjectId
    const fields = { name: "2K01", shift: CommissionShift.Noche, slots: [{ day: ClassDay.Sabado, start: "08:00", end: "09:00", classroom: null }] }
    await expect(createCommission(db, subjectId, { ...fields, period: CommissionPeriod.Anual })).rejects.toThrow("ya tiene una comisión")
    expect(await createCommission(db, subjectId, { ...fields, period: CommissionPeriod.PrimerCuatrimestre })).toBeGreaterThan(0)
  })
})
