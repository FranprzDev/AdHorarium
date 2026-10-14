import { asc, eq, inArray } from "drizzle-orm"
import type { AppDatabase } from "@/db/client"
import { careers, examTables, subjectCorrelatives, subjects } from "@/db/schema"
import { createEmptyExamTableMap, type SubjectsByExamTable } from "@/lib/exam-tables"
import { buildPlanSubjects } from "@/lib/plan-subjects"
import type { Career, PlanSubject } from "@/types/types"

export async function listCareers(db: AppDatabase): Promise<Career[]> {
  return db
    .select({ id: careers.id, code: careers.code, name: careers.name, plan: careers.plan })
    .from(careers)
    .orderBy(asc(careers.name))
}

export async function listPlanSubjects(db: AppDatabase, careerId: number): Promise<PlanSubject[]> {
  const subjectRows = await db
    .select({
      id: subjects.id,
      careerId: subjects.careerId,
      number: subjects.number,
      name: subjects.name,
      level: subjects.level,
      hours: subjects.hours,
      isElective: subjects.isElective,
      isBasicScience: subjects.isBasicScience,
      examTable: examTables.name,
    })
    .from(subjects)
    .leftJoin(examTables, eq(subjects.examTableId, examTables.id))
    .where(eq(subjects.careerId, careerId))
    .orderBy(asc(subjects.level), asc(subjects.number))
  if (subjectRows.length === 0) return []
  const correlativeRows = await db
    .select({
      subjectId: subjectCorrelatives.subjectId,
      requiredSubjectId: subjectCorrelatives.requiredSubjectId,
      purpose: subjectCorrelatives.purpose,
      requirementType: subjectCorrelatives.requirementType,
    })
    .from(subjectCorrelatives)
    .where(
      inArray(
        subjectCorrelatives.subjectId,
        subjectRows.map((row) => row.id),
      ),
    )
  return buildPlanSubjects(subjectRows, correlativeRows)
}

export async function listSubjectsByExamTable(db: AppDatabase, careerId: number): Promise<SubjectsByExamTable> {
  const rows = await db
    .select({ name: subjects.name, examTable: examTables.name })
    .from(subjects)
    .innerJoin(examTables, eq(subjects.examTableId, examTables.id))
    .where(eq(subjects.careerId, careerId))
    .orderBy(asc(subjects.name))
  const grouped = createEmptyExamTableMap()
  for (const row of rows) grouped[row.examTable].push(row.name)
  return grouped
}
