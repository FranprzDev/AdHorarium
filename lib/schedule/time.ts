import type { ClassSlot } from "@/lib/schedule/types"

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
export const MINUTES_PER_HOUR = 60

/** Minutes since midnight for an "HH:MM" string that already passed validation. */
export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":")
  return Number(hours) * MINUTES_PER_HOUR + Number(minutes)
}

export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR)
  const minutes = totalMinutes % MINUTES_PER_HOUR
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

/** True when two slots share a day and their time ranges intersect (touching ends do not overlap). */
export function slotsOverlap(a: ClassSlot, b: ClassSlot): boolean {
  if (a.day !== b.day) return false
  return toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end)
}

export function formatSlotTime(slot: Pick<ClassSlot, "start" | "end">): string {
  return `${slot.start}–${slot.end}`
}
