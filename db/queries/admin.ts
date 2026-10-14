import { and, asc, eq, ilike, ne, or, type SQL } from "drizzle-orm"
import type { AppDatabase } from "@/db/client"
import { careers, examTables, subjectCorrelatives, subjects } from "@/db/schema"
import {
  CORRELATIVE_VIOLATION_MESSAGES,
  findCorrelativeViolation,
  findLevelChangeConflicts,
  type RuleCorrelative,
  type RuleSubject,
} from "@/lib/admin/correlative-rules"
import type {
  AdminSubjectFilters,
  CorrelativeInput,
  CreateSubjectInput,
  SubjectFields,
  UpdateSubjectInput,
} from "@/lib/validation/admin"
import type { CorrelativePurpose, CorrelativeType, ExamTable } from "@/types/enums"

/** A business rule of the plan was broken; the message is safe to show to the admin. */
export class AdminRuleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AdminRuleError"
  }
}

export type AdminSubject = {
  id: number
  careerId: number
  careerName: string
  number: number
  name: string
  level: number
  hours: number | null
  isElective: boolean
  isBasicScience: boolean
  examTable: ExamTable | null
}

export type AdminCorrelative = {
  id: number
  subjectId: number
  requiredSubjectId: number
  requiredNumber: number
  requiredName: string
  requiredLevel: number
  purpose: CorrelativePurpose
  requirementType: CorrelativeType
}

const adminSubjectColumns = {
  id: subjects.id,
  careerId: subjects.careerId,
  careerName: careers.name,
  number: subjects.number,
  name: subjects.name,
  level: subjects.level,
  hours: subjects.hours,
  isElective: subjects.isElective,
  isBasicScience: subjects.isBasicScience,
  examTable: examTables.name,
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`)
}

export async function listAdminSubjects(db: AppDatabase, filters: AdminSubjectFilters): Promise<AdminSubject[]> {
  const conditions: SQL[] = []
  if (filters.careerId !== null) conditions.push(eq(subjects.careerId, filters.careerId))
  if (filters.level !== null) conditions.push(eq(subjects.level, filters.level))
  if (filters.search.length > 0) {
    const pattern = `%${escapeLikePattern(filters.search)}%`
    const searchCondition = or(ilike(subjects.name, pattern), ilike(careers.name, pattern))
    if (searchCondition) conditions.push(searchCondition)
  }
  return db
    .select(adminSubjectColumns)
    .from(subjects)
    .innerJoin(careers, eq(subjects.careerId, careers.id))
    .leftJoin(examTables, eq(subjects.examTableId, examTables.id))
    .where(and(...conditions))
    .orderBy(asc(careers.name), asc(subjects.level), asc(subjects.number))
}

async function getSubjectOrThrow(db: AppDatabase, subjectId: number): Promise<RuleSubject> {
  const [subject] = await db
    .select({ id: subjects.id, careerId: subjects.careerId, level: subjects.level, name: subjects.name })
    .from(subjects)
    .where(eq(subjects.id, subjectId))
    .limit(1)
  if (!subject) throw new AdminRuleError("La materia no existe")
  return subject
}

async function loadCareerPlan(
  db: AppDatabase,
  careerId: number,
): Promise<{ careerSubjects: RuleSubject[]; careerCorrelatives: RuleCorrelative[] }> {
  const careerSubjects = await db
    .select({ id: subjects.id, careerId: subjects.careerId, level: subjects.level, name: subjects.name })
    .from(subjects)
    .where(eq(subjects.careerId, careerId))
  const careerCorrelatives = await db
    .select({
      subjectId: subjectCorrelatives.subjectId,
      requiredSubjectId: subjectCorrelatives.requiredSubjectId,
      purpose: subjectCorrelatives.purpose,
      requirementType: subjectCorrelatives.requirementType,
    })
    .from(subjectCorrelatives)
    .innerJoin(subjects, eq(subjectCorrelatives.subjectId, subjects.id))
    .where(eq(subjects.careerId, careerId))
  return { careerSubjects, careerCorrelatives }
}

async function resolveExamTableId(db: AppDatabase, examTable: ExamTable | null): Promise<number | null> {
  if (examTable === null) return null
  const [row] = await db.select({ id: examTables.id }).from(examTables).where(eq(examTables.name, examTable)).limit(1)
  if (!row) throw new AdminRuleError("La mesa de examen no existe")
  return row.id
}

async function assertNumberAvailable(db: AppDatabase, careerId: number, number: number, exceptSubjectId: number | null): Promise<void> {
  const conditions = [eq(subjects.careerId, careerId), eq(subjects.number, number)]
  if (exceptSubjectId !== null) conditions.push(ne(subjects.id, exceptSubjectId))
  const [taken] = await db.select({ id: subjects.id }).from(subjects).where(and(...conditions)).limit(1)
  if (taken) throw new AdminRuleError(`Ya existe una materia con el número ${number} en esta carrera`)
}

async function toSubjectValues(db: AppDatabase, fields: SubjectFields) {
  return {
    number: fields.number,
    name: fields.name,
    level: fields.level,
    hours: fields.hours,
    isElective: fields.isElective,
    isBasicScience: fields.isBasicScience,
    examTableId: await resolveExamTableId(db, fields.examTable),
  }
}

export async function createSubject(db: AppDatabase, input: CreateSubjectInput): Promise<number> {
  const [career] = await db.select({ id: careers.id }).from(careers).where(eq(careers.id, input.careerId)).limit(1)
  if (!career) throw new AdminRuleError("La carrera no existe")
  await assertNumberAvailable(db, input.careerId, input.number, null)
  const [created] = await db
    .insert(subjects)
    .values({ careerId: input.careerId, ...(await toSubjectValues(db, input)) })
    .returning({ id: subjects.id })
  return created.id
}

export async function updateSubject(db: AppDatabase, input: UpdateSubjectInput): Promise<void> {
  const current = await getSubjectOrThrow(db, input.id)
  await assertNumberAvailable(db, current.careerId, input.number, input.id)
  if (input.level !== current.level) {
    const { careerSubjects, careerCorrelatives } = await loadCareerPlan(db, current.careerId)
    const conflicts = findLevelChangeConflicts(input.id, input.level, careerSubjects, careerCorrelatives)
    if (conflicts.length > 0) {
      const names = new Map(careerSubjects.map((subject) => [subject.id, subject.name]))
      const otherNames = conflicts.map((conflict) =>
        names.get(conflict.subjectId === input.id ? conflict.requiredSubjectId : conflict.subjectId),
      )
      throw new AdminRuleError(
        `No se puede cambiar el nivel: rompería correlativas con ${[...new Set(otherNames)].join(", ")}`,
      )
    }
  }
  await db.update(subjects).set(await toSubjectValues(db, input)).where(eq(subjects.id, input.id))
}

export async function deleteSubject(db: AppDatabase, subjectId: number): Promise<void> {
  await getSubjectOrThrow(db, subjectId)
  await db.delete(subjects).where(eq(subjects.id, subjectId))
}

export async function listSubjectCorrelatives(db: AppDatabase, subjectId: number): Promise<AdminCorrelative[]> {
  return db
    .select({
      id: subjectCorrelatives.id,
      subjectId: subjectCorrelatives.subjectId,
      requiredSubjectId: subjectCorrelatives.requiredSubjectId,
      requiredNumber: subjects.number,
      requiredName: subjects.name,
      requiredLevel: subjects.level,
      purpose: subjectCorrelatives.purpose,
      requirementType: subjectCorrelatives.requirementType,
    })
    .from(subjectCorrelatives)
    .innerJoin(subjects, eq(subjectCorrelatives.requiredSubjectId, subjects.id))
    .where(eq(subjectCorrelatives.subjectId, subjectId))
    .orderBy(asc(subjectCorrelatives.purpose), asc(subjects.level), asc(subjects.number))
}

export async function addCorrelative(db: AppDatabase, input: CorrelativeInput): Promise<number> {
  const subject = await getSubjectOrThrow(db, input.subjectId)
  const required = await getSubjectOrThrow(db, input.requiredSubjectId)
  const { careerSubjects, careerCorrelatives } = await loadCareerPlan(db, subject.careerId)
  const planSubjects = required.careerId === subject.careerId ? careerSubjects : [...careerSubjects, required]
  const violation = findCorrelativeViolation(input, planSubjects, careerCorrelatives)
  if (violation) throw new AdminRuleError(CORRELATIVE_VIOLATION_MESSAGES[violation])
  const [created] = await db.insert(subjectCorrelatives).values(input).returning({ id: subjectCorrelatives.id })
  return created.id
}

export async function removeCorrelative(db: AppDatabase, correlativeId: number): Promise<void> {
  const [deleted] = await db
    .delete(subjectCorrelatives)
    .where(eq(subjectCorrelatives.id, correlativeId))
    .returning({ id: subjectCorrelatives.id })
  if (!deleted) throw new AdminRuleError("La correlativa no existe")
}
