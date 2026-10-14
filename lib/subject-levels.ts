/** Year levels a subject can belong to in a UTN plan. Shared by the DB check constraint and form validation. */
export const MIN_SUBJECT_LEVEL = 1
export const MAX_SUBJECT_LEVEL = 6

export const SUBJECT_LEVELS: ReadonlyArray<number> = Array.from(
  { length: MAX_SUBJECT_LEVEL - MIN_SUBJECT_LEVEL + 1 },
  (_, index) => MIN_SUBJECT_LEVEL + index,
)
