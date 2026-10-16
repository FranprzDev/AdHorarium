import { asc, eq, sql } from "drizzle-orm"
import type { AppDatabase } from "@/db/client"
import { careers, commissions, subjects } from "@/db/schema"
import {
  buildCommissionImportPlan,
  CommissionImportError,
  type CatalogCommission,
  type CatalogSubject,
  type CommissionImportPlan,
} from "@/lib/schedule/commission-import"
import { CommissionImportStatus, ImportIssueLevel } from "@/types/enums"

export type CommissionImportResult = { created: number; updated: number; unchanged: number }

/** Every subject (with its career code and plan) and every commission, to match an import file against. */
export async function loadCommissionImportCatalog(db: AppDatabase): Promise<{ subjects: CatalogSubject[]; commissions: CatalogCommission[] }> {
  const [subjectRows, commissionRows] = await Promise.all([
    db
      .select({ id: subjects.id, careerCode: careers.code, plan: careers.plan, number: subjects.number, name: subjects.name })
      .from(subjects)
      .innerJoin(careers, eq(subjects.careerId, careers.id))
      .orderBy(asc(subjects.id)),
    db
      .select({
        id: commissions.id,
        subjectId: commissions.subjectId,
        name: commissions.name,
        shift: commissions.shift,
        period: commissions.period,
        slots: commissions.slots,
        term: commissions.term,
        source: commissions.source,
        sourceUrl: commissions.sourceUrl,
      })
      .from(commissions)
      .orderBy(asc(commissions.id)),
  ])
  return { subjects: subjectRows, commissions: commissionRows }
}

export async function previewCommissionImport(db: AppDatabase, content: string): Promise<CommissionImportPlan> {
  return buildCommissionImportPlan(content, await loadCommissionImportCatalog(db))
}

/**
 * Writes the new and changed commissions of a file in one upsert statement, keyed by (subject, name, period), so the
 * import is all or nothing and running it twice is a no-op. The plan is rebuilt here from the file: the preview the
 * admin saw is never trusted.
 */
export async function applyCommissionImport(db: AppDatabase, content: string, importedAt: Date): Promise<CommissionImportResult> {
  const plan = await previewCommissionImport(db, content)
  if (!plan.canApply) {
    const blocking = plan.issues.find((issue) => issue.level === ImportIssueLevel.Error)
    throw new CommissionImportError(blocking ? blocking.message : "No hay comisiones nuevas ni cambios para importar")
  }
  const pending = plan.items.filter((item) => item.status !== CommissionImportStatus.Unchanged)
  await db
    .insert(commissions)
    .values(
      pending.map((item) => ({
        subjectId: item.subjectId,
        name: item.name,
        shift: item.shift,
        period: item.period,
        slots: item.slots,
        term: item.term,
        source: item.source,
        sourceUrl: item.sourceUrl,
        sourceUpdatedAt: importedAt,
      })),
    )
    .onConflictDoUpdate({
      target: [commissions.subjectId, commissions.name, commissions.period],
      set: {
        shift: sql`excluded.shift`,
        slots: sql`excluded.slots`,
        term: sql`excluded.term`,
        source: sql`excluded.source`,
        sourceUrl: sql`excluded.source_url`,
        sourceUpdatedAt: sql`excluded.source_updated_at`,
        updatedAt: importedAt,
      },
    })
  return {
    created: plan.counts[CommissionImportStatus.Create],
    updated: plan.counts[CommissionImportStatus.Update],
    unchanged: plan.counts[CommissionImportStatus.Unchanged],
  }
}
