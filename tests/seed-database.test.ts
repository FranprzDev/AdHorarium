import { PGlite } from "@electric-sql/pglite"
import { count, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import * as schema from "@/db/schema"
import { buildSeedPlan } from "@/db/seed/plan-data"
import { seedDatabase } from "@/db/seed/seed-database"
import { SubjectStatus } from "@/types/enums"

const client = new PGlite()
const db = drizzle({ client, schema })
const plan = buildSeedPlan()

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" })
}, 60_000)

afterAll(async () => {
  await client.close()
})

async function tableCount(table: typeof schema.subjects | typeof schema.subjectCorrelatives | typeof schema.careers) {
  const [row] = await db.select({ value: count() }).from(table)
  return row.value
}

describe("migrations and seed", () => {
  it("seeds every career, subject and correlative", async () => {
    const counts = await seedDatabase(db, plan)
    expect(counts).toEqual({
      careers: plan.careers.length,
      examTables: 3,
      subjects: plan.subjects.length,
      correlatives: plan.correlatives.length,
    })
    expect(await tableCount(schema.subjects)).toBe(plan.subjects.length)
    expect(await tableCount(schema.subjectCorrelatives)).toBe(plan.correlatives.length)
  })

  it("is idempotent", async () => {
    await seedDatabase(db, plan)
    expect(await tableCount(schema.careers)).toBe(plan.careers.length)
    expect(await tableCount(schema.subjects)).toBe(plan.subjects.length)
    expect(await tableCount(schema.subjectCorrelatives)).toBe(plan.correlatives.length)
  })

  it("rejects a grade on a subject that is not promoted", async () => {
    const [subject] = await db.select({ id: schema.subjects.id }).from(schema.subjects).limit(1)
    await db.insert(schema.users).values({ id: "user-1", email: "student@example.com" })
    await expect(
      db.insert(schema.userSubjectStates).values({ userId: "user-1", subjectId: subject.id, status: SubjectStatus.Regular, grade: 8 }),
    ).rejects.toThrow()
    await db
      .insert(schema.userSubjectStates)
      .values({ userId: "user-1", subjectId: subject.id, status: SubjectStatus.Promocionada, grade: 8.5 })
    const [state] = await db.select().from(schema.userSubjectStates).where(eq(schema.userSubjectStates.userId, "user-1"))
    expect(state.grade).toBe(8.5)
  })

  it("rejects a self-referencing correlative", async () => {
    const [subject] = await db.select({ id: schema.subjects.id }).from(schema.subjects).limit(1)
    await expect(
      db.insert(schema.subjectCorrelatives).values({
        subjectId: subject.id,
        requiredSubjectId: subject.id,
        purpose: plan.correlatives[0].purpose,
        requirementType: plan.correlatives[0].requirementType,
      }),
    ).rejects.toThrow()
  })
})
