import type { Career } from "@/types/types"

export const BASIC_SCIENCES_CAREER_NAME = "Ciencias Básicas"

type CareerIdentity = Pick<Career, "name" | "plan">

function planYear(plan: string): number {
  const year = Number.parseInt(plan, 10)
  return Number.isNaN(year) ? 0 : year
}

/**
 * Name shown for a career in selectors and headings. A career offered on several plans (Sistemas 2023 and 2008) keeps
 * its plain name on the newest plan and gets "(Plan 2008)" on the older ones, so both options can be told apart.
 */
export function careerLabel(career: CareerIdentity, careers: ReadonlyArray<CareerIdentity>): string {
  let newest = planYear(career.plan)
  let shared = false
  for (const other of careers) {
    if (other.name !== career.name || other.plan === career.plan) continue
    shared = true
    newest = Math.max(newest, planYear(other.plan))
  }
  if (!shared || planYear(career.plan) === newest) return career.name
  return `${career.name} (Plan ${career.plan})`
}
