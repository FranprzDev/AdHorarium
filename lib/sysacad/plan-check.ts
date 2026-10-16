import type { Career } from "@/types/types"
import { normalizeSubjectName } from "./match"
import { dominantPlan } from "./table"
import type { SysacadRow } from "./types"

/** How the plan the student is on in SysAcad compares with the career selected in AdHorarium. */
export enum SysacadPlanCheckKind {
  /** Same plan, or SysAcad did not say which plan. */
  SamePlan = "same_plan",
  /** Another plan, and AdHorarium has the same career on that plan: offer to switch. */
  SwitchAvailable = "switch_available",
  /** Another plan that AdHorarium does not model yet: warn, rows are matched by equivalent name only. */
  PlanMissing = "plan_missing",
}

export type SysacadPlanCheck =
  | { kind: SysacadPlanCheckKind.SamePlan; sysacadPlan: string }
  | { kind: SysacadPlanCheckKind.SwitchAvailable; sysacadPlan: string; career: Career }
  | { kind: SysacadPlanCheckKind.PlanMissing; sysacadPlan: string }

/**
 * Compares the student's dominant SysAcad plan (most rows; the 2008 entrance course rows do not outvote a 2023 career)
 * with the selected career. A career on another plan is the one with the same name and that plan.
 */
export function checkSysacadPlan(rows: ReadonlyArray<SysacadRow>, selected: Career, careers: ReadonlyArray<Career>): SysacadPlanCheck {
  const sysacadPlan = dominantPlan(rows)
  if (sysacadPlan === "" || sysacadPlan === selected.plan) return { kind: SysacadPlanCheckKind.SamePlan, sysacadPlan }
  const name = normalizeSubjectName(selected.name)
  const career = careers.find((candidate) => candidate.plan === sysacadPlan && normalizeSubjectName(candidate.name) === name)
  if (career) return { kind: SysacadPlanCheckKind.SwitchAvailable, sysacadPlan, career }
  return { kind: SysacadPlanCheckKind.PlanMissing, sysacadPlan }
}
