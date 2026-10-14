import { CorrelativePurpose, CorrelativeType } from "@/types/enums"

export const CORRELATIVE_PURPOSE_LABELS: Record<CorrelativePurpose, string> = {
  [CorrelativePurpose.Cursar]: "Para cursar",
  [CorrelativePurpose.Rendir]: "Para rendir",
}

export const CORRELATIVE_TYPE_LABELS: Record<CorrelativeType, string> = {
  [CorrelativeType.Regulares]: "Regular",
  [CorrelativeType.Aprobadas]: "Aprobada",
}

/** Type guard for string enum values coming from `<Select>` callbacks. */
export function isEnumValue<T extends string>(enumObject: Record<string, T>, value: unknown): value is T {
  return typeof value === "string" && (Object.values(enumObject) as string[]).includes(value)
}
