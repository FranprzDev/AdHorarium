import type { Course, Subject } from "@/types/types"
import { CorrelativePurpose, CorrelativeType, SubjectStatus } from "@/types/enums"

/** Status of each course in a plan, keyed by course code. Missing codes count as not taken. */
export type CourseStates = Readonly<Record<string, SubjectStatus | undefined>>

export type MissingRequirements = {
  /** Codes that must be at least regular (regular or promoted) but are not. */
  missingRegular: string[]
  /** Codes that must be approved (promoted) but are not. */
  missingApproved: string[]
}

/** A course counts as approved when it was promoted (final grade obtained). */
export function isApproved(status: SubjectStatus | undefined): boolean {
  return status === SubjectStatus.Promocionada
}

/** A course satisfies a "regular" requirement when it is regular or already approved. */
export function isRegularOrApproved(status: SubjectStatus | undefined): boolean {
  return status === SubjectStatus.Regular || status === SubjectStatus.Promocionada
}

/**
 * Correlative codes shown for a course given what the student wants to do.
 * Taking the course (`cursar`) distinguishes regular vs approved requirements;
 * sitting the final exam (`rendir`) only has approved requirements.
 */
export function getCorrelatives(course: Course, purpose: CorrelativePurpose, type: CorrelativeType): string[] {
  if (purpose === CorrelativePurpose.Rendir) return course.aprobadasParaRendir
  return type === CorrelativeType.Regulares ? course.regularesParaCursar : course.aprobadasParaCursar
}

/** Requirements still missing for the student to take the course or sit its final exam. */
export function getMissingRequirements(
  course: Course,
  states: CourseStates,
  purpose: CorrelativePurpose,
): MissingRequirements {
  if (purpose === CorrelativePurpose.Rendir) {
    return {
      missingRegular: [],
      missingApproved: course.aprobadasParaRendir.filter((code) => !isApproved(states[code])),
    }
  }
  return {
    missingRegular: course.regularesParaCursar.filter((code) => !isRegularOrApproved(states[code])),
    missingApproved: course.aprobadasParaCursar.filter((code) => !isApproved(states[code])),
  }
}

function hasNoMissing(missing: MissingRequirements): boolean {
  return missing.missingRegular.length === 0 && missing.missingApproved.length === 0
}

/** A course can be taken when it was never taken and every "para cursar" requirement is met. */
export function canTakeCourse(course: Course, states: CourseStates): boolean {
  const status = states[course.code] ?? SubjectStatus.NoCursada
  if (status !== SubjectStatus.NoCursada) return false
  return hasNoMissing(getMissingRequirements(course, states, CorrelativePurpose.Cursar))
}

/** The final exam can be taken when the course is regular (not yet approved) and every "para rendir" requirement is approved. */
export function canSitFinalExam(course: Course, states: CourseStates): boolean {
  if (states[course.code] !== SubjectStatus.Regular) return false
  return hasNoMissing(getMissingRequirements(course, states, CorrelativePurpose.Rendir))
}

/** Courses of the plan the student is currently enabled to take or to sit the final exam for. */
export function getAvailableCourses(
  courses: ReadonlyArray<Course>,
  states: CourseStates,
  purpose: CorrelativePurpose,
): Course[] {
  const isAvailable = purpose === CorrelativePurpose.Cursar ? canTakeCourse : canSitFinalExam
  return courses.filter((course) => isAvailable(course, states))
}

function compareByLevel(a: Subject, b: Subject): number {
  return a.nivel.localeCompare(b.nivel)
}

/** Subjects required (to approve or to take) before the selected subject, sorted by level. */
export function getPrerequisiteSubjects(selected: Subject, allSubjects: ReadonlyArray<Subject>): Subject[] {
  return allSubjects
    .filter(
      (subject) =>
        selected.must_approve_names.includes(subject.subject_name) ||
        selected.must_take_names.includes(subject.subject_name),
    )
    .sort(compareByLevel)
}

/** Subjects the selected subject enables, sorted by level. */
export function getEnabledSubjects(selected: Subject, allSubjects: ReadonlyArray<Subject>): Subject[] {
  return allSubjects.filter((subject) => selected.enables_names.includes(subject.subject_name)).sort(compareByLevel)
}
