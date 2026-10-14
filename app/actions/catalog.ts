"use server"

import { getDb } from "@/db/client"
import { listCareers, listPlanSubjects, listSubjectsByExamTable } from "@/db/queries/catalog"
import { runAction, type ActionResult } from "@/lib/action-result"
import type { SubjectsByExamTable } from "@/lib/exam-tables"
import { careerIdInputSchema } from "@/lib/validation/student"
import type { Career, PlanSubject } from "@/types/types"

export async function getCareersAction(): Promise<ActionResult<Career[]>> {
  return runAction(() => listCareers(getDb()))
}

export async function getPlanSubjectsAction(careerId: number): Promise<ActionResult<PlanSubject[]>> {
  return runAction(async () => {
    const input = careerIdInputSchema.parse({ careerId })
    return listPlanSubjects(getDb(), input.careerId)
  })
}

export async function getSubjectsByExamTableAction(careerId: number): Promise<ActionResult<SubjectsByExamTable>> {
  return runAction(async () => {
    const input = careerIdInputSchema.parse({ careerId })
    return listSubjectsByExamTable(getDb(), input.careerId)
  })
}
