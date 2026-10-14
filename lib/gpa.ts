/**
 * Argentine (1-10) to US GPA (0.0-4.0) conversion.
 *
 * Thresholds follow docs/INFORME_CONVERSION_GPA_ARGENTINA.md, section 2.1.
 */
export const GPA_THRESHOLDS: ReadonlyArray<{ minGrade: number; gpa: number; letter: string }> = [
  { minGrade: 10, gpa: 4.0, letter: "A" },
  { minGrade: 8, gpa: 3.7, letter: "A-" },
  { minGrade: 7, gpa: 3.0, letter: "B" },
  { minGrade: 6, gpa: 2.3, letter: "C+" },
  { minGrade: 4, gpa: 1.0, letter: "D" },
]

export const MIN_ARGENTINE_GRADE = 1
export const MAX_ARGENTINE_GRADE = 10

/** Converts an Argentine grade (or average) to its GPA equivalent. Grades below 4 map to 0.0. */
export function convertToGPA(argentineGrade: number): number {
  for (const threshold of GPA_THRESHOLDS) {
    if (argentineGrade >= threshold.minGrade) return threshold.gpa
  }
  return 0.0
}

/** True when the value is a valid final grade on the Argentine 1-10 scale. */
export function isValidArgentineGrade(grade: number): boolean {
  return Number.isFinite(grade) && grade >= MIN_ARGENTINE_GRADE && grade <= MAX_ARGENTINE_GRADE
}

/** Average of the given grades rounded to two decimals, or null when there are none. */
export function averageGrade(grades: ReadonlyArray<number>): number | null {
  if (grades.length === 0) return null
  let total = 0
  for (const grade of grades) {
    total += grade
  }
  return Number((total / grades.length).toFixed(2))
}
