import { and, eq, inArray, sql } from "drizzle-orm"
import type { AppDatabase } from "@/db/client"
import { subjects, userSubjectStates } from "@/db/schema"
import { getUserCareerId, listUserSubjectStates } from "@/db/queries/student"
import {
  dedupeImportItems,
  planSysacadImport,
  summarizeSysacadChanges,
  WRITING_CHANGE_KINDS,
  type SysacadImportSummary,
} from "@/lib/sysacad/plan"
import type { SysacadImportInput } from "@/lib/sysacad/validation"

export class SysacadImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SysacadImportError"
  }
}

/**
 * Applies SysAcad states to the student's subjects. The plan is recomputed against the states stored right now (not
 * the ones the preview saw) and every write goes out as one multi-row upsert, so the import is all or nothing.
 */
export async function applySysacadImport(db: AppDatabase, userId: string, input: SysacadImportInput): Promise<SysacadImportSummary> {
  const careerId = await getUserCareerId(db, userId)
  if (careerId !== input.careerId) throw new SysacadImportError("Tu carrera cambió. Volvé a cargar la página para importar.")

  const items = dedupeImportItems(input.items)
  const ids = items.map((item) => item.subjectId)
  const owned = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(eq(subjects.careerId, careerId), inArray(subjects.id, ids)))
  if (owned.length !== ids.length) throw new SysacadImportError("Alguna materia no pertenece a tu carrera.")

  const changes = planSysacadImport(items, await listUserSubjectStates(db, userId, careerId), input.mode)
  const writes = changes.filter((change) => WRITING_CHANGE_KINDS.has(change.kind))
  if (writes.length > 0) {
    await db
      .insert(userSubjectStates)
      .values(writes.map((change) => ({ userId, subjectId: change.subjectId, status: change.next.status, grade: change.next.grade })))
      .onConflictDoUpdate({
        target: [userSubjectStates.userId, userSubjectStates.subjectId],
        set: { status: sql`excluded.status`, grade: sql`excluded.grade`, updatedAt: new Date() },
      })
  }
  return summarizeSysacadChanges(changes)
}
