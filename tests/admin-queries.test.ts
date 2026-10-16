import { PGlite } from "@electric-sql/pglite"
import { and, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import * as schema from "@/db/schema"
import {
  addCorrelative,
  createSubject,
  deleteSubject,
  listAdminSubjects,
  listSubjectCorrelatives,
  removeCorrelative,
  updateSubject,
  type AdminSubject,
} from "@/db/queries/admin"
import { seedDatabase } from "@/db/seed/seed-database"
import { CORRELATIVE_VIOLATION_MESSAGES, CorrelativeViolation } from "@/lib/admin/correlative-rules"
import type { SubjectFields } from "@/lib/validation/admin"
import { CareerCode, CorrelativePurpose, CorrelativeType, ExamTable } from "@/types/enums"

const client = new PGlite()
const db = drizzle({ client, schema })
let careerId = 0
let otherCareerId = 0

const noFilters = { careerId: null, level: null, search: "" }

function fieldsOf(subject: AdminSubject): SubjectFields {
  return {
    number: subject.number,
    name: subject.name,
    level: subject.level,
    hours: subject.hours,
    isElective: subject.isElective,
    isBasicScience: subject.isBasicScience,
    examTable: subject.examTable,
  }
}

async function findSubject(name: string, inCareer = careerId): Promise<AdminSubject> {
  const [subject] = await listAdminSubjects(db, { careerId: inCareer, level: null, search: name })
  if (!subject) throw new Error(`Missing seeded subject ${name}`)
  return subject
}

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" })
  await seedDatabase(db)
  const rows = await db.select().from(schema.careers)
  careerId = rows.find((row) => row.code === CareerCode.Sistemas)?.id ?? 0
  otherCareerId = rows.find((row) => row.code === CareerCode.Civil)?.id ?? 0
}, 60_000)

afterAll(async () => {
  await client.close()
})

describe("admin subject listing", () => {
  it("filters by career, level and text", async () => {
    const all = await listAdminSubjects(db, noFilters)
    const career = await listAdminSubjects(db, { ...noFilters, careerId })
    expect(career).toHaveLength(65)
    expect(all.length).toBeGreaterThan(career.length)
    const levelOne = await listAdminSubjects(db, { careerId, level: 1, search: "" })
    expect(levelOne.length).toBeGreaterThan(0)
    expect(levelOne.every((subject) => subject.level === 1)).toBe(true)
    const searched = await listAdminSubjects(db, { careerId, level: null, search: "análisis matemático" })
    expect(searched.map((subject) => subject.name)).toContain("Análisis Matemático I")
  })

  it("matches a numeric search against the subject number", async () => {
    const [first] = await listAdminSubjects(db, { careerId, level: 1, search: "" })
    if (!first) throw new Error("Missing seeded level 1 subject")
    const byNumber = await listAdminSubjects(db, { careerId, level: null, search: String(first.number) })
    expect(byNumber.map((subject) => subject.id)).toContain(first.id)
    expect(byNumber.every((subject) => subject.number === first.number || subject.name.includes(String(first.number)))).toBe(true)
  })

  it("treats LIKE wildcards in the search as literal text", async () => {
    expect(await listAdminSubjects(db, { careerId, level: null, search: "%" })).toEqual([])
  })
})

describe("admin subject CRUD", () => {
  it("creates, updates and deletes a subject", async () => {
    const id = await createSubject(db, {
      careerId,
      number: 900,
      name: "Materia de prueba",
      level: 3,
      hours: 4,
      isElective: true,
      isBasicScience: false,
      examTable: ExamTable.MesaI,
    })
    const [created] = await listAdminSubjects(db, { careerId, level: null, search: "Materia de prueba" })
    expect(created).toMatchObject({ id, number: 900, examTable: ExamTable.MesaI, isElective: true })

    await updateSubject(db, { id, ...fieldsOf(created), name: "Materia editada", examTable: null, level: 4 })
    const [updated] = await listAdminSubjects(db, { careerId, level: null, search: "Materia editada" })
    expect(updated).toMatchObject({ id, level: 4, examTable: null })

    await deleteSubject(db, id)
    expect(await listAdminSubjects(db, { careerId, level: null, search: "Materia editada" })).toEqual([])
  })

  it("rejects a duplicated number within the career", async () => {
    const existing = await findSubject("Análisis Matemático I")
    await expect(
      createSubject(db, { careerId, ...fieldsOf(existing), name: "Duplicada" }),
    ).rejects.toThrow(`Ya existe una materia con el número ${existing.number}`)
  })

  it("rejects level changes that break existing correlatives", async () => {
    const analysisOne = await findSubject("Análisis Matemático I")
    const analysisTwo = await findSubject("Análisis Matemático II")
    const correlatives = await listSubjectCorrelatives(db, analysisTwo.id)
    expect(correlatives.map((correlative) => correlative.requiredSubjectId)).toContain(analysisOne.id)
    await expect(updateSubject(db, { id: analysisOne.id, ...fieldsOf(analysisOne), level: 6 })).rejects.toThrow(
      "No se puede cambiar el nivel",
    )
    const [unchanged] = await db.select().from(schema.subjects).where(eq(schema.subjects.id, analysisOne.id))
    expect(unchanged.level).toBe(analysisOne.level)
  })
})

describe("admin correlatives", () => {
  it("adds and removes a valid correlative", async () => {
    const analysisOne = await findSubject("Análisis Matemático I")
    const finalProject = await findSubject("Proyecto Final")
    const input = {
      subjectId: finalProject.id,
      requiredSubjectId: analysisOne.id,
      purpose: CorrelativePurpose.Rendir,
      requirementType: CorrelativeType.Aprobadas,
    }
    const existing = await db
      .select()
      .from(schema.subjectCorrelatives)
      .where(
        and(
          eq(schema.subjectCorrelatives.subjectId, input.subjectId),
          eq(schema.subjectCorrelatives.requiredSubjectId, input.requiredSubjectId),
          eq(schema.subjectCorrelatives.purpose, input.purpose),
        ),
      )
    if (existing.length > 0) await removeCorrelative(db, existing[0].id)
    const id = await addCorrelative(db, input)
    expect((await listSubjectCorrelatives(db, finalProject.id)).some((correlative) => correlative.id === id)).toBe(true)
    await expect(addCorrelative(db, input)).rejects.toThrow(CORRELATIVE_VIOLATION_MESSAGES[CorrelativeViolation.Duplicate])
    await removeCorrelative(db, id)
    expect((await listSubjectCorrelatives(db, finalProject.id)).some((correlative) => correlative.id === id)).toBe(false)
  })

  it("rejects self references, other careers, higher levels and cycles", async () => {
    const analysisOne = await findSubject("Análisis Matemático I")
    const analysisTwo = await findSubject("Análisis Matemático II")
    const [otherCareerSubject] = await listAdminSubjects(db, { careerId: otherCareerId, level: 1, search: "" })
    const base = { purpose: CorrelativePurpose.Cursar, requirementType: CorrelativeType.Regulares }

    await expect(addCorrelative(db, { ...base, subjectId: analysisTwo.id, requiredSubjectId: analysisTwo.id })).rejects.toThrow(
      CORRELATIVE_VIOLATION_MESSAGES[CorrelativeViolation.SelfReference],
    )
    await expect(
      addCorrelative(db, { ...base, subjectId: analysisTwo.id, requiredSubjectId: otherCareerSubject.id }),
    ).rejects.toThrow(CORRELATIVE_VIOLATION_MESSAGES[CorrelativeViolation.OtherCareer])
    await expect(addCorrelative(db, { ...base, subjectId: analysisOne.id, requiredSubjectId: analysisTwo.id })).rejects.toThrow(
      CORRELATIVE_VIOLATION_MESSAGES[CorrelativeViolation.HigherLevel],
    )

    const sameLevelA = await createSubject(db, { careerId, number: 901, name: "Ciclo A", level: 2, hours: null, isElective: false, isBasicScience: false, examTable: null })
    const sameLevelB = await createSubject(db, { careerId, number: 902, name: "Ciclo B", level: 2, hours: null, isElective: false, isBasicScience: false, examTable: null })
    await addCorrelative(db, { ...base, subjectId: sameLevelB, requiredSubjectId: sameLevelA })
    await expect(addCorrelative(db, { ...base, subjectId: sameLevelA, requiredSubjectId: sameLevelB })).rejects.toThrow(
      CORRELATIVE_VIOLATION_MESSAGES[CorrelativeViolation.Cycle],
    )
    await deleteSubject(db, sameLevelA)
    expect(await listSubjectCorrelatives(db, sameLevelB)).toEqual([])
    await deleteSubject(db, sameLevelB)
  })

  it("keeps the database check against self references", async () => {
    const analysisOne = await findSubject("Análisis Matemático I")
    await expect(
      db.insert(schema.subjectCorrelatives).values({
        subjectId: analysisOne.id,
        requiredSubjectId: analysisOne.id,
        purpose: CorrelativePurpose.Cursar,
        requirementType: CorrelativeType.Regulares,
      }),
    ).rejects.toThrow()
  })
})
