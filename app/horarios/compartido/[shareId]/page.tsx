import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { PageHeader } from "@/components/brand/page-header"
import { PublicHeader } from "@/components/layout/public-header"
import { EntryList } from "@/components/schedule/entry-list"
import { ExportButtons } from "@/components/schedule/export-buttons"
import { ImportShareButton } from "@/components/schedule/import-share-button"
import { ScheduleGrid } from "@/components/schedule/schedule-grid"
import { getDb } from "@/db/client"
import { getSharedSchedule } from "@/db/queries/schedule"
import { findOverlaps } from "@/lib/schedule/overlaps"
import { shareIdSchema } from "@/lib/schedule/validation"

type SharedSchedulePageProps = { params: Promise<{ shareId: string }> }

export const metadata: Metadata = {
  title: "Horario compartido",
  robots: { index: false, follow: false },
}

export default async function SharedSchedulePage({ params }: SharedSchedulePageProps) {
  const { shareId } = await params
  const parsedId = shareIdSchema.safeParse(shareId)
  if (!parsedId.success) notFound()
  const [schedule, session] = await Promise.all([getSharedSchedule(getDb(), parsedId.data), auth()])
  if (!schedule) notFound()

  const overlapIds = new Set<number>()
  for (const overlap of findOverlaps(schedule.entries)) {
    overlapIds.add(overlap.firstEntryId)
    overlapIds.add(overlap.secondEntryId)
  }
  const owner = schedule.displayName ?? "un estudiante"

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 md:px-8 md:py-8">
        <PageHeader
          eyebrow="Horario compartido"
          title={`Horario de ${owner}`}
          description={`${schedule.careerName}. Vista de solo lectura: importalo para armar tu propio horario a partir de este.`}
          actions={
            <>
              <ExportButtons entries={schedule.entries} meta={{ studentName: schedule.displayName, careerName: schedule.careerName }} />
              <ImportShareButton shareId={schedule.id} isSignedIn={Boolean(session?.user?.id)} />
            </>
          }
        />
        {schedule.unavailableCount > 0 && (
          <p className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
            {schedule.unavailableCount} {schedule.unavailableCount === 1 ? "materia ya no está disponible" : "materias ya no están disponibles"} (su
            comisión fue eliminada del catálogo) y no se muestra.
          </p>
        )}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <ScheduleGrid entries={schedule.entries} />
          <section className="surface-card space-y-3 p-4 md:p-5" aria-labelledby="shared-subjects-title">
            <h2 id="shared-subjects-title" className="font-serif text-lg font-semibold text-foreground">
              Materias ({schedule.entries.length})
            </h2>
            <EntryList entries={schedule.entries} overlappingEntryIds={overlapIds} />
          </section>
        </div>
      </main>
    </div>
  )
}
