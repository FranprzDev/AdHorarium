import { cn } from "@/lib/utils"
import { SubjectStatus } from "@/types/enums"
import { SUBJECT_STATUS_COLORS, SUBJECT_STATUS_LABELS } from "@/lib/subject-status"

/** Status pattern of the abstract cards; purely decorative, it does not represent real student data. */
const PREVIEW_COLUMNS: SubjectStatus[][] = [
  [SubjectStatus.Promocionada, SubjectStatus.Promocionada, SubjectStatus.Regular, SubjectStatus.Promocionada],
  [SubjectStatus.Regular, SubjectStatus.Cursando, SubjectStatus.Promocionada, SubjectStatus.Cursando],
  [SubjectStatus.Cursando, SubjectStatus.NoCursada, SubjectStatus.NoCursada, SubjectStatus.NoCursada],
]

const LEGEND: SubjectStatus[] = [SubjectStatus.Promocionada, SubjectStatus.Regular, SubjectStatus.Cursando, SubjectStatus.NoCursada]

/** Decorative, text-free preview of the study plan board used on the landing hero. */
export function PlanPreview({ className }: { className?: string }) {
  return (
    <figure className={cn("surface-card relative p-5 shadow-lg shadow-primary/5", className)} aria-hidden="true">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="space-y-2">
          <div className="h-2.5 w-28 rounded-full bg-primary/80" />
          <div className="h-2 w-40 rounded-full bg-muted-foreground/25" />
        </div>
        <span className="rounded-full border border-border px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
          Vista ilustrativa
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {PREVIEW_COLUMNS.map((column, columnIndex) => (
          <div key={columnIndex} className="space-y-2.5">
            <div className="mx-auto h-2 w-12 rounded-full bg-muted-foreground/30" />
            {column.map((status, cardIndex) => (
              <div key={cardIndex} className="rounded-lg border border-border bg-background p-2.5">
                <div className="h-2 w-full rounded-full bg-foreground/15" />
                <div className="mt-1.5 h-2 w-2/3 rounded-full bg-foreground/10" />
                <div
                  className={cn(
                    "mt-3 h-1.5 w-full rounded-full",
                    status === SubjectStatus.NoCursada ? "bg-border" : SUBJECT_STATUS_COLORS[status],
                  )}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      <figcaption className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-4">
        {LEGEND.map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", SUBJECT_STATUS_COLORS[status])} />
            {SUBJECT_STATUS_LABELS[status]}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
