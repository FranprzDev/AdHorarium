import { CLASS_DAYS } from "@/lib/schedule/labels"
import { findOverlaps, overlappingSlotKeys, slotKey } from "@/lib/schedule/overlaps"
import { MINUTES_PER_HOUR, toMinutes } from "@/lib/schedule/time"
import type { ClassSlot, ScheduleEntry } from "@/lib/schedule/types"
import { ClassDay } from "@/types/enums"

/** Visible hours when the timetable is empty or very short. */
export const DEFAULT_START_MINUTES = 8 * MINUTES_PER_HOUR
export const DEFAULT_END_MINUTES = 13 * MINUTES_PER_HOUR

/** Light, print friendly colors; each entry gets one by its position in the timetable. */
export const ENTRY_COLORS: ReadonlyArray<{ fill: string; border: string; text: string }> = [
  { fill: "#E3EAF6", border: "#2F4F86", text: "#13294B" },
  { fill: "#F6ECD9", border: "#A8752A", text: "#4A3210" },
  { fill: "#E2F1EA", border: "#2E7D5B", text: "#123D2B" },
  { fill: "#F3E4EC", border: "#9A3F6B", text: "#43172D" },
  { fill: "#E6EEF1", border: "#3B7487", text: "#11323D" },
  { fill: "#EDE7F6", border: "#5E4A9A", text: "#251A47" },
  { fill: "#F5E6DF", border: "#A4553A", text: "#4A2214" },
  { fill: "#ECEFDF", border: "#6B7A2C", text: "#2C3410" },
]
export const OVERLAP_COLOR = "#C0392B"

export type GridBlock = {
  key: string
  entryId: number
  slotIndex: number
  dayIndex: number
  startMinutes: number
  endMinutes: number
  subjectName: string
  label: string
  slot: ClassSlot
  colorIndex: number
  isOverlapping: boolean
  /** Column inside a group of simultaneous blocks of the same day, and how many columns that group has. */
  column: number
  columns: number
}

export type GridLayout = {
  days: ClassDay[]
  startMinutes: number
  endMinutes: number
  blocks: GridBlock[]
  overlapCount: number
}

function assignColumns(dayBlocks: GridBlock[]): void {
  dayBlocks.sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes)
  let group: GridBlock[] = []
  let groupEnd = -1
  const closeGroup = () => {
    const columnEnds: number[] = []
    for (const block of group) {
      let column = columnEnds.findIndex((end) => end <= block.startMinutes)
      if (column === -1) {
        column = columnEnds.length
        columnEnds.push(block.endMinutes)
      } else {
        columnEnds[column] = block.endMinutes
      }
      block.column = column
    }
    for (const block of group) block.columns = columnEnds.length
  }
  for (const block of dayBlocks) {
    if (group.length > 0 && block.startMinutes >= groupEnd) {
      closeGroup()
      group = []
      groupEnd = -1
    }
    group.push(block)
    groupEnd = Math.max(groupEnd, block.endMinutes)
  }
  if (group.length > 0) closeGroup()
}

/** Positions every slot of the timetable on a Monday–Friday (plus Saturday when used) grid. */
export function computeGridLayout(entries: ReadonlyArray<ScheduleEntry>): GridLayout {
  const overlaps = findOverlaps(entries)
  const overlapping = overlappingSlotKeys(overlaps)
  const usesSaturday = entries.some((entry) => entry.slots.some((slot) => slot.day === ClassDay.Sabado))
  const days = CLASS_DAYS.filter((day) => day !== ClassDay.Sabado || usesSaturday)

  let startMinutes = Number.POSITIVE_INFINITY
  let endMinutes = Number.NEGATIVE_INFINITY
  const blocks: GridBlock[] = []
  entries.forEach((entry, entryIndex) => {
    entry.slots.forEach((slot, slotIndex) => {
      const start = toMinutes(slot.start)
      const end = toMinutes(slot.end)
      startMinutes = Math.min(startMinutes, start)
      endMinutes = Math.max(endMinutes, end)
      blocks.push({
        key: slotKey(entry.id, slotIndex),
        entryId: entry.id,
        slotIndex,
        dayIndex: days.indexOf(slot.day),
        startMinutes: start,
        endMinutes: end,
        subjectName: entry.subjectName,
        label: entry.label,
        slot,
        colorIndex: entryIndex % ENTRY_COLORS.length,
        isOverlapping: overlapping.has(slotKey(entry.id, slotIndex)),
        column: 0,
        columns: 1,
      })
    })
  })

  if (blocks.length === 0) {
    startMinutes = DEFAULT_START_MINUTES
    endMinutes = DEFAULT_END_MINUTES
  } else {
    startMinutes = Math.floor(startMinutes / MINUTES_PER_HOUR) * MINUTES_PER_HOUR
    endMinutes = Math.ceil(endMinutes / MINUTES_PER_HOUR) * MINUTES_PER_HOUR
    if (endMinutes - startMinutes < DEFAULT_END_MINUTES - DEFAULT_START_MINUTES) {
      endMinutes = Math.min(24 * MINUTES_PER_HOUR, startMinutes + (DEFAULT_END_MINUTES - DEFAULT_START_MINUTES))
    }
  }

  for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
    assignColumns(blocks.filter((block) => block.dayIndex === dayIndex))
  }
  return { days, startMinutes, endMinutes, blocks, overlapCount: overlaps.length }
}

/** Whole hours shown as grid lines, from start to end inclusive. */
export function gridHours(layout: Pick<GridLayout, "startMinutes" | "endMinutes">): number[] {
  const hours: number[] = []
  for (let minutes = layout.startMinutes; minutes <= layout.endMinutes; minutes += MINUTES_PER_HOUR) hours.push(minutes)
  return hours
}
