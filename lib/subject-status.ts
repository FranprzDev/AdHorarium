import { BadgeVariant, SubjectStatus } from "@/types/enums"

/** Human readable (Spanish) label for each subject status. */
export const SUBJECT_STATUS_LABELS: Record<SubjectStatus, string> = {
  [SubjectStatus.NoCursada]: "No Cursando",
  [SubjectStatus.Cursando]: "Cursando",
  [SubjectStatus.Regular]: "Regular",
  [SubjectStatus.Promocionada]: "Promocionado",
}

/** Tailwind background class used as the status dot color. */
export const SUBJECT_STATUS_COLORS: Record<SubjectStatus, string> = {
  [SubjectStatus.NoCursada]: "bg-slate-400",
  [SubjectStatus.Cursando]: "bg-sky-600",
  [SubjectStatus.Regular]: "bg-amber-500",
  [SubjectStatus.Promocionada]: "bg-emerald-600",
}

/** Badge label and variant shown on subject cards for each status. */
export const SUBJECT_STATUS_BADGES: Record<SubjectStatus, { label: string; variant: BadgeVariant }> = {
  [SubjectStatus.Promocionada]: { label: "PROMOCIONADO", variant: BadgeVariant.Promocionado },
  [SubjectStatus.Regular]: { label: "REGULAR", variant: BadgeVariant.Regular },
  [SubjectStatus.Cursando]: { label: "CURSANDO", variant: BadgeVariant.Cursando },
  [SubjectStatus.NoCursada]: { label: "", variant: BadgeVariant.NoCursando },
}

const SUBJECT_STATUS_VALUES = new Set<string>(Object.values(SubjectStatus))

export function isSubjectStatus(value: unknown): value is SubjectStatus {
  return typeof value === "string" && SUBJECT_STATUS_VALUES.has(value)
}
