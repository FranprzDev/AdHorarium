import { SysacadRowStatus, type SysacadStatusInfo } from "./types"

const MIN_GRADE = 1
const MAX_GRADE = 10

const APPROVED_PATTERN = /^(?:aprobad[ao]|promocionad[ao])\b/i
const GRADE_PATTERN = /\bcon\s+(\d{1,2}(?:[.,]\d{1,2})?)\b/i
const REGULAR_PATTERN = /^regular\b/i
const ENROLLED_PATTERN = /^cursa\b/i
const YEAR_PATTERN = /\ben\s+((?:19|20)\d{2})\b/i
const TERM_PATTERN = /\(\s*([0-9]+\s*[a-z]{1,3})\s*\)/i
const COMMISSION_PATTERN = /^cursa\s+en\s+([^\s,]+)/i

/** Collapses every run of whitespace (including non-breaking spaces) into one space and trims. */
export function cleanCellText(text: string): string {
  return text.replace(/[\s\u00a0]+/g, " ").trim()
}

function readYear(text: string): number | undefined {
  const match = YEAR_PATTERN.exec(text)
  return match ? Number.parseInt(match[1], 10) : undefined
}

function readGrade(text: string): number | undefined {
  const match = GRADE_PATTERN.exec(text)
  if (!match) return undefined
  const grade = Number.parseFloat(match[1].replace(",", "."))
  return grade >= MIN_GRADE && grade <= MAX_GRADE ? grade : undefined
}

/**
 * Interprets the free text of SysAcad's "Estado" column. Unknown text is kept as `raw` so the student sees what
 * was not understood instead of losing it silently.
 */
export function parseSysacadStatus(text: string): SysacadStatusInfo {
  const value = cleanCellText(text)
  if (value === "") return { status: SysacadRowStatus.None }

  if (APPROVED_PATTERN.test(value)) {
    const info: SysacadStatusInfo = { status: SysacadRowStatus.Approved }
    const grade = readGrade(value)
    if (grade !== undefined) info.grade = grade
    const year = readYear(value)
    if (year !== undefined) info.approvedYear = year
    return info
  }

  if (REGULAR_PATTERN.test(value)) {
    const info: SysacadStatusInfo = { status: SysacadRowStatus.Regular }
    const year = readYear(value)
    if (year !== undefined) info.regularYear = year
    const term = TERM_PATTERN.exec(value)
    if (term) info.term = term[1].replace(/\s+/g, "").toUpperCase()
    return info
  }

  if (ENROLLED_PATTERN.test(value)) {
    const info: SysacadStatusInfo = { status: SysacadRowStatus.Enrolled }
    const commission = COMMISSION_PATTERN.exec(value)
    if (commission) info.commission = commission[1].toUpperCase()
    return info
  }

  return { status: SysacadRowStatus.Unknown, raw: value }
}
