import type { ClassSlot } from "@/lib/schedule/types"
import { slotsOverlap } from "@/lib/schedule/time"

export type OverlapCandidate = { id: number; slots: ReadonlyArray<ClassSlot> }

/** A pair of slots of two different entries that happen at the same time. */
export type ScheduleOverlap = {
  firstEntryId: number
  firstSlotIndex: number
  secondEntryId: number
  secondSlotIndex: number
}

/** Every clash between slots of different entries. */
export function findOverlaps(entries: ReadonlyArray<OverlapCandidate>): ScheduleOverlap[] {
  const overlaps: ScheduleOverlap[] = []
  for (let first = 0; first < entries.length; first++) {
    for (let second = first + 1; second < entries.length; second++) {
      const a = entries[first]
      const b = entries[second]
      a.slots.forEach((slotA, indexA) => {
        b.slots.forEach((slotB, indexB) => {
          if (slotsOverlap(slotA, slotB)) {
            overlaps.push({ firstEntryId: a.id, firstSlotIndex: indexA, secondEntryId: b.id, secondSlotIndex: indexB })
          }
        })
      })
    }
  }
  return overlaps
}

/** Key of a single slot of an entry, used to flag clashing blocks in the grid. */
export function slotKey(entryId: number, slotIndex: number): string {
  return `${entryId}:${slotIndex}`
}

export function overlappingSlotKeys(overlaps: ReadonlyArray<ScheduleOverlap>): Set<string> {
  const keys = new Set<string>()
  for (const overlap of overlaps) {
    keys.add(slotKey(overlap.firstEntryId, overlap.firstSlotIndex))
    keys.add(slotKey(overlap.secondEntryId, overlap.secondSlotIndex))
  }
  return keys
}

/** True when any pair of slots inside one list clash (a commission cannot meet twice at the same time). */
export function hasInternalOverlap(slots: ReadonlyArray<ClassSlot>): boolean {
  for (let first = 0; first < slots.length; first++) {
    for (let second = first + 1; second < slots.length; second++) {
      if (slotsOverlap(slots[first], slots[second])) return true
    }
  }
  return false
}

/** Commissions whose slots clash with the given entries (ignoring the entry of the same subject, which would be replaced). */
export function commissionClashes(
  commissionSlots: ReadonlyArray<ClassSlot>,
  subjectId: number,
  entries: ReadonlyArray<{ subjectId: number; subjectName: string; slots: ReadonlyArray<ClassSlot> }>,
): string[] {
  const names = new Set<string>()
  for (const entry of entries) {
    if (entry.subjectId === subjectId) continue
    for (const slot of entry.slots) {
      if (commissionSlots.some((candidate) => slotsOverlap(candidate, slot))) names.add(entry.subjectName)
    }
  }
  return [...names]
}
