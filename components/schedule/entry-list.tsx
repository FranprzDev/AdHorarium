"use client"

import { ArrowLeftRight, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CLASS_DAY_SHORT_LABELS, COMMISSION_PERIOD_LABELS, COMMISSION_SHIFT_LABELS } from "@/lib/schedule/labels"
import { ENTRY_COLORS } from "@/lib/schedule/layout"
import type { ScheduleEntry } from "@/lib/schedule/types"
import { BadgeVariant, ScheduleEntryKind } from "@/types/enums"

type EntryListProps = {
  entries: ReadonlyArray<ScheduleEntry>
  overlappingEntryIds: ReadonlySet<number>
  onHighlight?: (entryId: number | null) => void
  onEdit?: (entry: ScheduleEntry) => void
  /** Opens the commission picker of a catalog entry's subject. */
  onChangeCommission?: (entry: ScheduleEntry) => void
  onDelete?: (entry: ScheduleEntry) => void
}

/** Subjects of the timetable with their commission and slots; actions are optional (read-only on shared pages). */
export function EntryList({ entries, overlappingEntryIds, onHighlight, onEdit, onChangeCommission, onDelete }: EntryListProps) {
  return (
    <ul className="space-y-2">
      {entries.map((entry, index) => {
        const colors = ENTRY_COLORS[index % ENTRY_COLORS.length]
        const isCustom = entry.kind === ScheduleEntryKind.Custom
        return (
          <li
            key={entry.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-background p-3"
            onMouseEnter={() => onHighlight?.(entry.id)}
            onMouseLeave={() => onHighlight?.(null)}
          >
            <span className="mt-1 h-3 w-3 shrink-0 rounded-sm border" style={{ backgroundColor: colors.fill, borderColor: colors.border }} aria-hidden="true" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium leading-snug text-foreground">{entry.subjectName}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={BadgeVariant.Secondary} className="font-medium">
                  {entry.label}
                </Badge>
                {entry.shift && (
                  <Badge variant={BadgeVariant.Outline} className="font-normal">
                    {COMMISSION_SHIFT_LABELS[entry.shift]}
                  </Badge>
                )}
                {entry.period && (
                  <Badge variant={BadgeVariant.Outline} className="font-normal">
                    {COMMISSION_PERIOD_LABELS[entry.period]}
                  </Badge>
                )}
                <Badge variant={BadgeVariant.Outline} className="font-normal text-muted-foreground">
                  {isCustom ? "Manual" : "Catálogo"}
                </Badge>
                {overlappingEntryIds.has(entry.id) && <Badge variant={BadgeVariant.Destructive}>Se superpone</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                {entry.slots
                  .map((slot) => `${CLASS_DAY_SHORT_LABELS[slot.day]} ${slot.start}–${slot.end}${slot.classroom ? ` (${slot.classroom})` : ""}`)
                  .join(" · ")}
              </p>
            </div>
            {(onEdit || onChangeCommission || onDelete) && (
              <div className="flex shrink-0 gap-1">
                {onChangeCommission && !isCustom && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onChangeCommission(entry)}
                    aria-label={`Cambiar la comisión de ${entry.subjectName}`}
                    title="Cambiar comisión"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>
                )}
                {onEdit && isCustom && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(entry)} aria-label={`Editar ${entry.subjectName}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(entry)}
                    aria-label={`Quitar ${entry.subjectName} del horario`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
