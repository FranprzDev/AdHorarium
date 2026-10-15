import { PGlite } from "@electric-sql/pglite"
import { and, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import * as schema from "@/db/schema"
import { listPlanSubjects, listSubjectsByExamTable } from "@/db/queries/catalog"
import { getStudentProfile, getUserCareer, listUserSubjectStates, setUserCareer, upsertUserSubjectState } from "@/db/queries/student"
import { seedDatabase } from "@/db/seed/seed-database"
import { CareerCode, ExamTable, SubjectStatus } from "@/types/enums"

const client = new PGlite()
const db = drizzle({ client, schema })
const USER_ID = "student-1"
let careerId = 0
let subjectIds: number[] = []

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" })
  await seedDatabase(db)
  const [career] = await db.select().from(schema.careers).where(eq(schema.careers.code, CareerCode.Sistemas))
  careerId = career.id
  const rows = await db.select({ id: schema.subjects.id }).from(schema.subjects).where(eq(schema.subjects.careerId, careerId))
  subjectIds = rows.map((row) => row.id)
  await db.insert(schema.users).values({ id: USER_ID, email: "student@example.com", name: "Student" })
}, 60_000)

afterAll(async () => {
  await client.close()
})

describe("catalog queries", () => {
  it("returns the plan with correlatives resolved to subject ids", async () => {
    const plan = await listPlanSubjects(db, careerId)
    expect(plan).toHaveLength(36)
    const finalProject = plan.find((subject) => subject.name === "Proyecto Final")
    expect(finalProject?.approvedToTakeIds.length).toBeGreaterThan(0)
    const ids = new Set(plan.map((subject) => subject.id))
    for (const subject of plan) {
      for (const id of [...subject.regularToTakeIds, ...subject.approvedToTakeIds, ...subject.enablesIds]) expect(ids.has(id)).toBe(true)
    }
  })

  it("groups the career subjects by exam table", async () => {
    const grouped = await listSubjectsByExamTable(db, careerId)
    expect(grouped[ExamTable.MesaI]).toContain("Análisis Matemático I")
  })
})

describe("student queries", () => {
  it("returns no career until the student selects one", async () => {
    expect(await getUserCareer(db, USER_ID)).toBeNull()
  })

  it("stores the career and subject states and computes the average from user_subject_states", async () => {
    await setUserCareer(db, USER_ID, careerId)
    await upsertUserSubjectState(db, USER_ID, { subjectId: subjectIds[0], status: SubjectStatus.Promocionada, grade: 8 })
    await upsertUserSubjectState(db, USER_ID, { subjectId: subjectIds[1], status: SubjectStatus.Promocionada, grade: 9 })
    await upsertUserSubjectState(db, USER_ID, { subjectId: subjectIds[2], status: SubjectStatus.Regular, grade: null })
    const states = await listUserSubjectStates(db, USER_ID, careerId)
    expect(states[subjectIds[2]]).toEqual({ status: SubjectStatus.Regular, grade: null })
    const profile = await getStudentProfile(db, USER_ID)
    expect(profile.careerId).toBe(careerId)
    expect(profile.averageGrade).toBe(8.5)
    expect(profile.gradedSubjectsCount).toBe(2)
    expect(await getUserCareer(db, USER_ID)).toMatchObject({ id: careerId, code: CareerCode.Sistemas })
  })

  it("updates an existing state instead of duplicating it", async () => {
    await upsertUserSubjectState(db, USER_ID, { subjectId: subjectIds[1], status: SubjectStatus.Cursando, grade: null })
    const rows = await db
      .select()
      .from(schema.userSubjectStates)
      .where(and(eq(schema.userSubjectStates.userId, USER_ID), eq(schema.userSubjectStates.subjectId, subjectIds[1])))
    expect(rows).toHaveLength(1)
    expect((await getStudentProfile(db, USER_ID)).averageGrade).toBe(8)
  })

  it("rejects unknown careers and subjects", async () => {
    await expect(setUserCareer(db, USER_ID, 99_999)).rejects.toThrow()
    await expect(
      upsertUserSubjectState(db, USER_ID, { subjectId: 99_999, status: SubjectStatus.Regular, grade: null }),
    ).rejects.toThrow()
  })
})
