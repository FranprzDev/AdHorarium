"use client"

import { AlertTriangle } from "lucide-react"
import { CLASS_DAY_LABELS, CLASS_DAY_SHORT_LABELS } from "@/lib/schedule/labels"
import { ENTRY_COLORS, OVERLAP_COLOR, computeGridLayout, gridHours } from "@/lib/schedule/layout"
import { MINUTES_PER_HOUR, formatMinutes } from "@/lib/schedule/time"
import type { ScheduleEntry } from "@/lib/schedule/types"

const HOUR_HEIGHT_PX = 56

type ScheduleGridProps = {
  entries: ReadonlyArray<ScheduleEntry>
  /** Highlights the blocks of one entry, e.g. while hovering it in the list. */
  highlightedEntryId?: number | null
}

/** Weekly timetable: one column per day, blocks positioned by time, clashing blocks side by side in red. */
export function ScheduleGrid({ entries, highlightedEntryId = null }: ScheduleGridProps) {
  const layout = computeGridLayout(entries)
  const hours = gridHours(layout)
  const bodyHeight = ((layout.endMinutes - layout.startMinutes) / MINUTES_PER_HOUR) * HOUR_HEIGHT_PX
  const topOf = (minutes: number) => ((minutes - layout.startMinutes) / MINUTES_PER_HOUR) * HOUR_HEIGHT_PX
  const dayWidth = 100 / layout.days.length

  return (
    <div className="surface-card overflow-x-auto" role="region" aria-label="Horario semanal">
      <div className="min-w-[640px]">
        <div className="grid border-b border-border bg-muted/50" style={{ gridTemplateColumns: `3.5rem repeat(${layout.days.length}, minmax(0, 1fr))` }}>
          <div />
          {layout.days.map((day) => (
            <div key={day} className="border-l border-border px-2 py-2 text-center text-sm font-semibold text-foreground">
              <span className="hidden sm:inline">{CLASS_DAY_LABELS[day]}</span>
              <span className="sm:hidden">{CLASS_DAY_SHORT_LABELS[day]}</span>
            </div>
          ))}
        </div>
        <div className="relative flex pb-4 pt-2">
          <div className="relative w-14 shrink-0" style={{ height: bodyHeight }}>
            {hours.map((minutes) => (
              <span
                key={minutes}
                className="absolute right-2 -translate-y-1/2 text-[0.7rem] tabular-nums text-muted-foreground"
                style={{ top: topOf(minutes) }}
              >
                {formatMinutes(minutes)}
              </span>
            ))}
          </div>
          <div className="relative flex-1" style={{ height: bodyHeight }}>
            {hours.map((minutes) => (
              <div key={minutes} className="absolute inset-x-0 border-t border-border" style={{ top: topOf(minutes) }} />
            ))}
            {layout.days.map((day, index) => (
              <div key={day} className="absolute inset-y-0 border-l border-border" style={{ left: `${index * dayWidth}%` }} />
            ))}
            {layout.blocks.map((block) => {
              const colors = ENTRY_COLORS[block.colorIndex]
              const columnWidth = dayWidth / block.columns
              const isDimmed = highlightedEntryId !== null && highlightedEntryId !== block.entryId
              return (
                <div
                  key={block.key}
                  className="absolute overflow-hidden rounded-md border px-2 py-1 text-left shadow-sm transition-opacity"
                  style={{
                    top: topOf(block.startMinutes) + 1,
                    height: topOf(block.endMinutes) - topOf(block.startMinutes) - 2,
                    left: `calc(${block.dayIndex * dayWidth + block.column * columnWidth}% + 2px)`,
                    width: `calc(${columnWidth}% - 4px)`,
                    backgroundColor: colors.fill,
                    color: colors.text,
                    borderColor: block.isOverlapping ? OVERLAP_COLOR : colors.border,
                    borderWidth: block.isOverlapping ? 2 : 1,
                    borderLeftWidth: 4,
                    borderLeftColor: block.isOverlapping ? OVERLAP_COLOR : colors.border,
                    opacity: isDimmed ? 0.35 : 1,
                  }}
                  title={`${block.subjectName} · ${block.label} · ${block.slot.start}–${block.slot.end}${block.slot.classroom ? ` · ${block.slot.classroom}` : ""}`}
                >
                  <p className="line-clamp-2 text-xs font-semibold leading-tight">{block.subjectName}</p>
                  <p className="truncate text-[0.68rem] leading-tight opacity-90">
                    {block.slot.start}–{block.slot.end} · {block.label}
                  </p>
                  {block.slot.classroom && <p className="truncate text-[0.68rem] leading-tight opacity-90">{block.slot.classroom}</p>}
                  {block.isOverlapping && (
                    <p className="mt-0.5 flex items-center gap-1 text-[0.68rem] font-semibold" style={{ color: OVERLAP_COLOR }}>
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                      Superposición
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
