import { sql } from "drizzle-orm"
import type { AppDatabase } from "@/db/client"
import { careers, examTables, subjectCorrelatives, subjects } from "@/db/schema"
import { buildSeedPlan, type SeedPlan } from "@/db/seed/plan-data"
import type { CareerCode, ExamTable } from "@/types/enums"

export const SEED_BATCH_SIZE = 200

export type SeedCounts = {
  careers: number
  examTables: number
  subjects: number
  correlatives: number
}

function chunk<T>(items: ReadonlyArray<T>, size: number): T[][] {
  const chunks: T[][] = []
  for (let start = 0; start < items.length; start += size) chunks.push(items.slice(start, start + size))
  return chunks
}

function requireId<K>(map: ReadonlyMap<K, number>, key: K, label: string): number {
  const id = map.get(key)
  if (id === undefined) throw new Error(`Seed reference not found: ${label}`)
  return id
}

export async function seedDatabase(db: AppDatabase, plan: SeedPlan = buildSeedPlan()): Promise<SeedCounts> {
  const examTableRows = await db
    .insert(examTables)
    .values(plan.examTables)
    .onConflictDoUpdate({ target: examTables.name, set: { description: sql`excluded.description` } })
    .returning({ id: examTables.id, name: examTables.name })
  const examTableIds = new Map<ExamTable, number>(examTableRows.map((row) => [row.name, row.id]))

  const careerRows = await db
    .insert(careers)
    .values(plan.careers)
    .onConflictDoUpdate({ target: careers.code, set: { name: sql`excluded.name`, plan: sql`excluded.plan` } })
    .returning({ id: careers.id, code: careers.code })
  const careerIds = new Map<string, number>(careerRows.map((row) => [row.code, row.id]))

  const subjectIds = new Map<string, number>()
  const subjectKey = (careerCode: CareerCode, number: number) => `${careerCode}#${number}`
  for (const batch of chunk(plan.subjects, SEED_BATCH_SIZE)) {
    const rows = await db
      .insert(subjects)
      .values(
        batch.map((subject) => ({
          careerId: requireId(careerIds, subject.careerCode, `career ${subject.careerCode}`),
          number: subject.number,
          name: subject.name,
          level: subject.level,
          isBasicScience: subject.isBasicScience,
          examTableId: subject.examTable ? requireId(examTableIds, subject.examTable, subject.examTable) : null,
        })),
      )
      .onConflictDoUpdate({
        target: [subjects.careerId, subjects.number],
        set: {
          name: sql`excluded.name`,
          level: sql`excluded.level`,
          isBasicScience: sql`excluded.is_basic_science`,
          examTableId: sql`excluded.exam_table_id`,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: subjects.id, careerId: subjects.careerId, number: subjects.number })
    for (const row of rows) {
      const code = careerRows.find((career) => career.id === row.careerId)?.code
      if (code) subjectIds.set(`${code}#${row.number}`, row.id)
    }
  }

  for (const batch of chunk(plan.correlatives, SEED_BATCH_SIZE)) {
    await db
      .insert(subjectCorrelatives)
      .values(
        batch.map((correlative) => ({
          subjectId: requireId(
            subjectIds,
            subjectKey(correlative.careerCode, correlative.subjectNumber),
            `subject ${correlative.careerCode} ${correlative.subjectNumber}`,
          ),
          requiredSubjectId: requireId(
            subjectIds,
            subjectKey(correlative.careerCode, correlative.requiredNumber),
            `subject ${correlative.careerCode} ${correlative.requiredNumber}`,
          ),
          purpose: correlative.purpose,
          requirementType: correlative.requirementType,
        })),
      )
      .onConflictDoUpdate({
        target: [subjectCorrelatives.subjectId, subjectCorrelatives.requiredSubjectId, subjectCorrelatives.purpose],
        set: { requirementType: sql`excluded.requirement_type` },
      })
  }

  return {
    careers: careerRows.length,
    examTables: examTableRows.length,
    subjects: subjectIds.size,
    correlatives: plan.correlatives.length,
  }
}
