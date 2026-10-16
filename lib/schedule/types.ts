import type { ClassDay, CommissionPeriod, CommissionShift, ScheduleEntryKind } from "@/types/enums"

/** One weekly class meeting. Times are "HH:MM" in the faculty's local time. */
export type ClassSlot = {
  day: ClassDay
  start: string
  end: string
  classroom: string | null
}

/** A commission of the admin catalog with its weekly slots. */
export type Commission = {
  id: number
  subjectId: number
  name: string
  shift: CommissionShift
  period: CommissionPeriod
  slots: ClassSlot[]
}

/** Commission as listed in the admin panel, with how many student timetables use it. */
export type AdminCommission = Commission & { entryCount: number }

/** Timetable entry with everything needed to draw it: catalog entries carry the live commission data. */
export type ScheduleEntry = {
  id: number
  kind: ScheduleEntryKind
  subjectId: number
  subjectName: string
  subjectLevel: number
  commissionId: number | null
  /** Commission name for catalog entries, the student's label for custom ones. */
  label: string
  shift: CommissionShift | null
  period: CommissionPeriod | null
  slots: ClassSlot[]
}

/** Entry stored inside a share: catalog commissions by id (read live), custom entries copied. */
export type SharedEntry =
  | { kind: ScheduleEntryKind.Commission; subjectId: number; commissionId: number }
  | { kind: ScheduleEntryKind.Custom; subjectId: number; label: string; slots: ClassSlot[] }

/** Public, read-only view of a share. Entries whose commission was deleted are reported as unavailable. */
export type SharedSchedule = {
  id: string
  displayName: string | null
  careerId: number
  careerName: string
  createdAt: Date
  entries: ScheduleEntry[]
  unavailableCount: number
}

/** Header data printed on exports. */
export type ScheduleExportMeta = {
  studentName: string | null
  careerName: string
  generatedAt: Date
}
