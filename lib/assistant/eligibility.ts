import { isApproved, isRegularOrApproved } from "@/lib/correlatives"
import { SubjectStatus } from "@/types/enums"
import type { PlanSubject, UserSubjectStates } from "@/types/types"

/** Requirements a student still lacks, as subject ids of the same plan. */
export type MissingSubjectIds = {
  /** Subjects that must be at least regular (regular or promoted) but are not. */
  regular: number[]
  /** Subjects that must be approved (promoted) but are not. */
  approved: number[]
}

/** Status of a subject for the student. Subjects without a stored state count as not taken. */
export function getSubjectStatus(states: UserSubjectStates, subjectId: number): SubjectStatus {
  return states[subjectId]?.status ?? SubjectStatus.NoCursada
}

/** "Para cursar" correlatives the student has not met yet. */
export function getMissingToTake(subject: PlanSubject, states: UserSubjectStates): MissingSubjectIds {
  return {
    regular: subject.regularToTakeIds.filter((id) => !isRegularOrApproved(getSubjectStatus(states, id))),
    approved: subject.approvedToTakeIds.filter((id) => !isApproved(getSubjectStatus(states, id))),
  }
}

/** "Para rendir" correlatives the student has not approved yet. */
export function getMissingToSit(subject: PlanSubject, states: UserSubjectStates): number[] {
  return subject.approvedToSitIds.filter((id) => !isApproved(getSubjectStatus(states, id)))
}

/** A subject can be taken when it was never taken and every "para cursar" correlative is met. */
export function canTakeSubject(subject: PlanSubject, states: UserSubjectStates): boolean {
  if (getSubjectStatus(states, subject.id) !== SubjectStatus.NoCursada) return false
  const missing = getMissingToTake(subject, states)
  return missing.regular.length === 0 && missing.approved.length === 0
}

/** The final exam can be taken when the subject is regular and every "para rendir" correlative is approved. */
export function canSitSubjectFinal(subject: PlanSubject, states: UserSubjectStates): boolean {
  if (getSubjectStatus(states, subject.id) !== SubjectStatus.Regular) return false
  return getMissingToSit(subject, states).length === 0
}
