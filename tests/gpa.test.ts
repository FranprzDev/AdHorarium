import { describe, expect, it } from "vitest"
import { GPA_THRESHOLDS, averageGrade, convertToGPA, isValidArgentineGrade } from "@/lib/gpa"

describe("convertToGPA", () => {
  it.each([
    [10, 4.0],
    [9, 3.7],
    [8, 3.7],
    [7, 3.0],
    [6, 2.3],
    [5, 1.0],
    [4, 1.0],
    [3, 0.0],
    [1, 0.0],
  ])("maps the Argentine grade %d to %d as in the GPA report table", (grade, gpa) => {
    expect(convertToGPA(grade)).toBe(gpa)
  })

  it("uses the lower band for averages between integer thresholds", () => {
    expect(convertToGPA(9.99)).toBe(3.7)
    expect(convertToGPA(7.99)).toBe(3.0)
    expect(convertToGPA(6.5)).toBe(2.3)
    expect(convertToGPA(3.99)).toBe(0.0)
  })

  it("never returns a value outside the 0.0-4.0 scale", () => {
    for (let grade = 0; grade <= 10; grade += 0.25) {
      const gpa = convertToGPA(grade)
      expect(gpa).toBeGreaterThanOrEqual(0)
      expect(gpa).toBeLessThanOrEqual(4)
    }
  })

  it("is monotonic: a higher grade never yields a lower GPA", () => {
    let previous = convertToGPA(0)
    for (let grade = 0.1; grade <= 10; grade += 0.1) {
      const gpa = convertToGPA(grade)
      expect(gpa).toBeGreaterThanOrEqual(previous)
      previous = gpa
    }
  })

  it("keeps thresholds sorted from highest to lowest grade", () => {
    for (let i = 1; i < GPA_THRESHOLDS.length; i++) {
      expect(GPA_THRESHOLDS[i].minGrade).toBeLessThan(GPA_THRESHOLDS[i - 1].minGrade)
    }
  })
})

describe("isValidArgentineGrade", () => {
  it("accepts grades in the 1-10 range, including decimals", () => {
    expect(isValidArgentineGrade(1)).toBe(true)
    expect(isValidArgentineGrade(7.5)).toBe(true)
    expect(isValidArgentineGrade(10)).toBe(true)
  })

  it("rejects out-of-range and non-numeric values", () => {
    expect(isValidArgentineGrade(0)).toBe(false)
    expect(isValidArgentineGrade(10.5)).toBe(false)
    expect(isValidArgentineGrade(Number.NaN)).toBe(false)
    expect(isValidArgentineGrade(Number.POSITIVE_INFINITY)).toBe(false)
  })
})

describe("averageGrade", () => {
  it("returns null when there are no grades", () => {
    expect(averageGrade([])).toBeNull()
  })

  it("averages and rounds to two decimals", () => {
    expect(averageGrade([8])).toBe(8)
    expect(averageGrade([7, 8, 10])).toBe(8.33)
    expect(averageGrade([6, 7])).toBe(6.5)
  })
})
