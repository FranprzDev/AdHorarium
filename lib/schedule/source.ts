import type { Commission } from "@/lib/schedule/types"

/** Dates are shown in the faculty's time zone so the server and the browser render the same text. */
const SOURCE_DATE_FORMAT = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Argentina/Tucuman",
})

/** "Fuente: Departamento de Sistemas UTN-FRT · 2.º cuatrimestre 2026 · actualizado 16/10/2026", or null for hand-made commissions. */
export function formatCommissionSource(commission: Pick<Commission, "source" | "term" | "sourceUpdatedAt">): string | null {
  if (!commission.source) return null
  const parts = [`Fuente: ${commission.source}`]
  if (commission.term) parts.push(commission.term)
  if (commission.sourceUpdatedAt) parts.push(`actualizado ${SOURCE_DATE_FORMAT.format(new Date(commission.sourceUpdatedAt))}`)
  return parts.join(" · ")
}
