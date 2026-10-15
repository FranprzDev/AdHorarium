import { and, eq, isNotNull } from "drizzle-orm"
import type { AppDatabase } from "@/db/client"
import { careers, subjects, users, userSubjectStates } from "@/db/schema"
import { averageGrade } from "@/lib/gpa"
import type { UpdateSubjectStateInput } from "@/lib/validation/student"
import { SubjectStatus } from "@/types/enums"
import type { Career, UserSubjectStates } from "@/types/types"

export type StudentProfile = {
  name: string | null
  email: string
  image: string | null
  careerId: number | null
  careerName: string | null
  averageGrade: number | null
  gradedSubjectsCount: number
}

export async function getUserCareerId(db: AppDatabase, userId: string): Promise<number | null> {
  const [row] = await db.select({ careerId: users.careerId }).from(users).where(eq(users.id, userId)).limit(1)
  return row?.careerId ?? null
}

export async function setUserCareer(db: AppDatabase, userId: string, careerId: number): Promise<void> {
  const [career] = await db.select({ id: careers.id }).from(careers).where(eq(careers.id, careerId)).limit(1)
  if (!career) throw new Error("La carrera seleccionada no existe")
  await db.update(users).set({ careerId }).where(eq(users.id, userId))
}

export async function listUserSubjectStates(db: AppDatabase, userId: string, careerId: number): Promise<UserSubjectStates> {
  const rows = await db
    .select({ subjectId: userSubjectStates.subjectId, status: userSubjectStates.status, grade: userSubjectStates.grade })
    .from(userSubjectStates)
    .innerJoin(subjects, eq(userSubjectStates.subjectId, subjects.id))
    .where(and(eq(userSubjectStates.userId, userId), eq(subjects.careerId, careerId)))
  const states: UserSubjectStates = {}
  for (const row of rows) states[row.subjectId] = { status: row.status, grade: row.grade }
  return states
}

export async function upsertUserSubjectState(db: AppDatabase, userId: string, input: UpdateSubjectStateInput): Promise<void> {
  const [subject] = await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.id, input.subjectId)).limit(1)
  if (!subject) throw new Error("La materia no existe")
  await db
    .insert(userSubjectStates)
    .values({ userId, subjectId: input.subjectId, status: input.status, grade: input.grade })
    .onConflictDoUpdate({
      target: [userSubjectStates.userId, userSubjectStates.subjectId],
      set: { status: input.status, grade: input.grade, updatedAt: new Date() },
    })
}

export async function getStudentProfile(db: AppDatabase, userId: string): Promise<StudentProfile> {
  const [user] = await db
    .select({ name: users.name, email: users.email, image: users.image, careerId: users.careerId, careerName: careers.name })
    .from(users)
    .leftJoin(careers, eq(users.careerId, careers.id))
    .where(eq(users.id, userId))
    .limit(1)
  if (!user) throw new Error("Usuario no encontrado")
  const grades: number[] = []
  if (user.careerId !== null) {
    const rows = await db
      .select({ grade: userSubjectStates.grade })
      .from(userSubjectStates)
      .innerJoin(subjects, eq(userSubjectStates.subjectId, subjects.id))
      .where(
        and(
          eq(userSubjectStates.userId, userId),
          eq(subjects.careerId, user.careerId),
          eq(userSubjectStates.status, SubjectStatus.Promocionada),
          isNotNull(userSubjectStates.grade),
        ),
      )
    for (const row of rows) {
      if (row.grade !== null) grades.push(row.grade)
    }
  }
  return { ...user, averageGrade: averageGrade(grades), gradedSubjectsCount: grades.length }
}

/** Career selected by the user, or null when they have not chosen one yet. */
export async function getUserCareer(db: AppDatabase, userId: string): Promise<Career | null> {
  const [row] = await db
    .select({ id: careers.id, code: careers.code, name: careers.name, plan: careers.plan })
    .from(users)
    .innerJoin(careers, eq(users.careerId, careers.id))
    .where(eq(users.id, userId))
    .limit(1)
  return row ?? null
}
