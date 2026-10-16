import { PGlite } from "@electric-sql/pglite"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import * as schema from "@/db/schema"
import { applySysacadImport } from "@/db/queries/sysacad-import"
import { listUserSubjectStates, setUserCareer } from "@/db/queries/student"
import { seedDatabase } from "@/db/seed/seed-database"
import {
  countWrites,
  dedupeImportItems,
  planSysacadImport,
  summarizeSysacadChanges,
  SysacadChangeKind,
  SysacadImportMode,
  sysacadRowToState,
} from "@/lib/sysacad/plan"
import { SysacadRowStatus } from "@/lib/sysacad/types"
import { sysacadImportInputSchema } from "@/lib/sysacad/validation"
import { CareerCode, SubjectStatus } from "@/types/enums"
import type { UserSubjectStates } from "@/types/types"

const promoted = (grade: number | null) => ({ status: SubjectStatus.Promocionada, grade })
const regular = { status: SubjectStatus.Regular, grade: null }
const taking = { status: SubjectStatus.Cursando, grade: null }
const notTaken = { status: SubjectStatus.NoCursada, grade: null }

describe("sysacadRowToState", () => {
  const row = { year: 1, name: "Física I", plan: "2023" }
  it("maps SysAcad states to app states", () => {
    expect(sysacadRowToState({ ...row, status: SysacadRowStatus.Approved, grade: 8 })).toEqual(promoted(8))
    expect(sysacadRowToState({ ...row, status: SysacadRowStatus.Approved, approvedYear: 2021 })).toEqual(promoted(null))
    expect(sysacadRowToState({ ...row, status: SysacadRowStatus.Regular, regularYear: 2022 })).toEqual(regular)
    expect(sysacadRowToState({ ...row, status: SysacadRowStatus.Enrolled, commission: "1K01" })).toEqual(taking)
    expect(sysacadRowToState({ ...row, status: SysacadRowStatus.None })).toBeNull()
    expect(sysacadRowToState({ ...row, status: SysacadRowStatus.Unknown, raw: "x" })).toBeNull()
  })
})

describe("planSysacadImport", () => {
  const current: UserSubjectStates = {
    1: regular,
    2: promoted(null),
    3: promoted(9),
    4: promoted(7),
    5: taking,
    6: notTaken,
    7: regular,
  }
  const items = [
    { subjectId: 1, ...promoted(8) },
    { subjectId: 2, ...promoted(6) },
    { subjectId: 3, ...promoted(null) },
    { subjectId: 4, ...promoted(8) },
    { subjectId: 5, ...regular },
    { subjectId: 6, ...taking },
    { subjectId: 7, ...taking },
    { subjectId: 8, ...regular },
  ]

  it("Combinar only fills and upgrades", () => {
    const kinds = planSysacadImport(items, current, SysacadImportMode.Merge).map((change) => [change.subjectId, change.kind])
    expect(kinds).toEqual([
      [1, SysacadChangeKind.Upgrade],
      [2, SysacadChangeKind.GradeFill],
      [3, SysacadChangeKind.Unchanged],
      [4, SysacadChangeKind.Kept],
      [5, SysacadChangeKind.Upgrade],
      [6, SysacadChangeKind.New],
      [7, SysacadChangeKind.Kept],
      [8, SysacadChangeKind.New],
    ])
  })

  it("Combinar keeps the student's value when it does not write", () => {
    const changes = planSysacadImport(items, current, SysacadImportMode.Merge)
    expect(changes.find((change) => change.subjectId === 4)?.next).toEqual(promoted(7))
    expect(changes.find((change) => change.subjectId === 7)?.next).toEqual(regular)
    expect(changes.find((change) => change.subjectId === 3)?.next).toEqual(promoted(9))
  })

  it("Reemplazar also lowers states and changes grades, but never erases a grade", () => {
    const changes = planSysacadImport(items, current, SysacadImportMode.Replace)
    const byId = new Map(changes.map((change) => [change.subjectId, change]))
    expect(byId.get(4)).toMatchObject({ kind: SysacadChangeKind.GradeChange, next: promoted(8) })
    expect(byId.get(7)).toMatchObject({ kind: SysacadChangeKind.Downgrade, next: taking })
    expect(byId.get(3)).toMatchObject({ kind: SysacadChangeKind.Unchanged, next: promoted(9) })
    expect(byId.get(1)?.kind).toBe(SysacadChangeKind.Upgrade)
  })

  it("summarizes and counts writes", () => {
    const summary = summarizeSysacadChanges(planSysacadImport(items, current, SysacadImportMode.Merge))
    expect(summary).toMatchObject({ [SysacadChangeKind.New]: 2, [SysacadChangeKind.Upgrade]: 2, [SysacadChangeKind.GradeFill]: 1, [SysacadChangeKind.Kept]: 2 })
    expect(countWrites(summary)).toBe(5)
    expect(countWrites(summarizeSysacadChanges(planSysacadImport(items, current, SysacadImportMode.Replace)))).toBe(7)
  })

  it("keeps the most advanced state when two rows point at one subject", () => {
    expect(dedupeImportItems([{ subjectId: 1, ...taking }, { subjectId: 1, ...promoted(null) }, { subjectId: 1, ...promoted(7) }, { subjectId: 1, ...regular }])).toEqual([
      { subjectId: 1, ...promoted(7) },
    ])
  })

  it("does nothing for a No cursada import on an empty subject", () => {
    expect(planSysacadImport([{ subjectId: 9, ...notTaken }], {}, SysacadImportMode.Merge)[0].kind).toBe(SysacadChangeKind.Unchanged)
  })
})

describe("import input validation", () => {
  it("rejects grades on non promoted subjects and empty imports", () => {
    expect(() => sysacadImportInputSchema.parse({ careerId: 1, mode: SysacadImportMode.Merge, items: [{ subjectId: 1, status: SubjectStatus.Regular, grade: 8 }] })).toThrow()
    expect(() => sysacadImportInputSchema.parse({ careerId: 1, mode: SysacadImportMode.Merge, items: [] })).toThrow("al menos una")
    expect(() => sysacadImportInputSchema.parse({ careerId: 1, mode: "otro", items: [{ subjectId: 1, ...regular }] })).toThrow()
  })
})

describe("applySysacadImport", () => {
  const client = new PGlite()
  const db = drizzle({ client, schema })
  const USER_ID = "sysacad-student"
  let careerId = 0
  let otherCareerSubjectId = 0
  let ids: number[] = []

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "drizzle" })
    await seedDatabase(db)
    const careers = await db.select().from(schema.careers)
    const systems = careers.find((career) => career.code === CareerCode.Sistemas)
    const other = careers.find((career) => career.code !== CareerCode.Sistemas)
    if (!systems || !other) throw new Error("Seed is missing careers")
    careerId = systems.id
    const rows = await db.select({ id: schema.subjects.id }).from(schema.subjects).where(eq(schema.subjects.careerId, careerId))
    ids = rows.map((row) => row.id).slice(0, 4)
    const [otherSubject] = await db.select({ id: schema.subjects.id }).from(schema.subjects).where(eq(schema.subjects.careerId, other.id)).limit(1)
    otherCareerSubjectId = otherSubject.id
    await db.insert(schema.users).values({ id: USER_ID, email: "sysacad@example.com", name: "SysAcad" })
    await setUserCareer(db, USER_ID, careerId)
  }, 60_000)

  beforeEach(async () => {
    await db.delete(schema.userSubjectStates).where(eq(schema.userSubjectStates.userId, USER_ID))
    await db.insert(schema.userSubjectStates).values([
      { userId: USER_ID, subjectId: ids[0], status: SubjectStatus.Promocionada, grade: 9 },
      { userId: USER_ID, subjectId: ids[1], status: SubjectStatus.Cursando, grade: null },
    ])
  })

  afterAll(async () => {
    await client.close()
  })

  const items = () => [
    { subjectId: ids[0], status: SubjectStatus.Regular, grade: null },
    { subjectId: ids[1], status: SubjectStatus.Promocionada, grade: 7 },
    { subjectId: ids[2], status: SubjectStatus.Regular, grade: null },
  ]

  it("Combinar upgrades and fills in one write, keeping higher states", async () => {
    const summary = await applySysacadImport(db, USER_ID, { careerId, mode: SysacadImportMode.Merge, items: items() })
    expect(summary).toMatchObject({ [SysacadChangeKind.Kept]: 1, [SysacadChangeKind.Upgrade]: 1, [SysacadChangeKind.New]: 1 })
    const states = await listUserSubjectStates(db, USER_ID, careerId)
    expect(states[ids[0]]).toEqual(promoted(9))
    expect(states[ids[1]]).toEqual(promoted(7))
    expect(states[ids[2]]).toEqual(regular)
    expect(states[ids[3]]).toBeUndefined()
  })

  it("Reemplazar overwrites imported subjects only", async () => {
    const summary = await applySysacadImport(db, USER_ID, { careerId, mode: SysacadImportMode.Replace, items: items().slice(0, 1) })
    expect(summary[SysacadChangeKind.Downgrade]).toBe(1)
    const states = await listUserSubjectStates(db, USER_ID, careerId)
    expect(states[ids[0]]).toEqual(regular)
    expect(states[ids[1]]).toEqual(taking)
  })

  it("rejects subjects of another career and writes nothing", async () => {
    await expect(
      applySysacadImport(db, USER_ID, {
        careerId,
        mode: SysacadImportMode.Merge,
        items: [...items(), { subjectId: otherCareerSubjectId, status: SubjectStatus.Regular, grade: null }],
      }),
    ).rejects.toThrow("no pertenece a tu carrera")
    const states = await listUserSubjectStates(db, USER_ID, careerId)
    expect(states[ids[2]]).toBeUndefined()
  })

  it("rejects an import made for a career the student no longer has", async () => {
    await expect(applySysacadImport(db, USER_ID, { careerId: careerId + 1000, mode: SysacadImportMode.Merge, items: items() })).rejects.toThrow("carrera cambió")
  })
})
