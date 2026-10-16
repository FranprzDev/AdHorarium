import { cleanCellText, parseSysacadStatus } from "./status"
import type { SysacadRow } from "./types"

/** Columns of the "Estado académico" table, identified by their header text. */
export enum SysacadColumn {
  Year = "year",
  Name = "name",
  Status = "status",
  Plan = "plan",
}

export type SysacadColumnIndexes = Record<SysacadColumn, number>

/** Column order of the page as published; used when a pasted table has no header row. */
export const DEFAULT_COLUMN_INDEXES: SysacadColumnIndexes = {
  [SysacadColumn.Year]: 0,
  [SysacadColumn.Name]: 1,
  [SysacadColumn.Status]: 2,
  [SysacadColumn.Plan]: 3,
}

const HEADER_NAMES: Record<string, SysacadColumn> = {
  ano: SysacadColumn.Year,
  nivel: SysacadColumn.Year,
  materia: SysacadColumn.Name,
  asignatura: SysacadColumn.Name,
  estado: SysacadColumn.Status,
  plan: SysacadColumn.Plan,
}

const YEAR_CELL = /^\d{1,2}$/
const PLAN_CELL = /^\d{4}$/
/** "3  Bases de Datos  Aprobada con 7 ...  2023" when a copy lost its tabs; status words anchor the split. */
const LOOSE_ROW = /^(\d{1,2})\s+(.+?)\s*((?:aprobad[ao]|promocionad[ao]|regular|cursa)\b.*?)?\s*(\d{4})$/i

/** Lowercase, accent-free, letters and digits only; used for header detection. */
function headerKey(text: string): string {
  return cleanCellText(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

/** Finds the four columns in a header row, in any order. Returns null when any is missing. */
export function detectColumns(cells: ReadonlyArray<string>): SysacadColumnIndexes | null {
  const found: Partial<SysacadColumnIndexes> = {}
  cells.forEach((cell, index) => {
    const column = HEADER_NAMES[headerKey(cell)]
    if (column !== undefined && found[column] === undefined) found[column] = index
  })
  const year = found[SysacadColumn.Year]
  const name = found[SysacadColumn.Name]
  const status = found[SysacadColumn.Status]
  const plan = found[SysacadColumn.Plan]
  if (year === undefined || name === undefined || status === undefined || plan === undefined) return null
  return { [SysacadColumn.Year]: year, [SysacadColumn.Name]: name, [SysacadColumn.Status]: status, [SysacadColumn.Plan]: plan }
}

function rowFromCells(cells: ReadonlyArray<string>, columns: SysacadColumnIndexes): SysacadRow | null {
  const yearText = cleanCellText(cells[columns[SysacadColumn.Year]] ?? "")
  const name = cleanCellText(cells[columns[SysacadColumn.Name]] ?? "")
  if (!YEAR_CELL.test(yearText) || name === "") return null
  const plan = cleanCellText(cells[columns[SysacadColumn.Plan]] ?? "")
  return {
    year: Number.parseInt(yearText, 10),
    name,
    plan,
    ...parseSysacadStatus(cells[columns[SysacadColumn.Status]] ?? ""),
  }
}

/**
 * Turns a table, given as rows of cell texts, into SysAcad rows. The header row may sit anywhere (titles above it
 * are skipped) and its columns may come in any order; without a header the published order is assumed. Rows that
 * are not subjects (blank lines, footers) are dropped.
 */
export function rowsFromGrid(grid: ReadonlyArray<ReadonlyArray<string>>): SysacadRow[] {
  let columns: SysacadColumnIndexes | null = null
  const rows: SysacadRow[] = []
  for (const cells of grid) {
    const header = detectColumns(cells)
    if (header) {
      columns = header
      continue
    }
    const row = rowFromCells(cells, columns ?? DEFAULT_COLUMN_INDEXES)
    if (row) rows.push(row)
  }
  return rows
}

function looseCells(line: string): string[] | null {
  const match = LOOSE_ROW.exec(cleanCellText(line))
  if (!match) return null
  return [match[1], match[2], match[3] ?? "", match[4]]
}

/**
 * Splits text copied from the SysAcad page (Ctrl+A / Ctrl+C) into cells. Browsers copy table cells separated by
 * tabs; lines without tabs fall back to a pattern anchored on the year, the status words and the plan.
 */
export function gridFromText(text: string): string[][] {
  const grid: string[][] = []
  for (const line of text.split(/\r?\n/)) {
    if (cleanCellText(line) === "") continue
    if (line.includes("\t")) {
      grid.push(line.split("\t"))
      continue
    }
    const header = cleanCellText(line).split(" ")
    if (detectColumns(header)) {
      grid.push(header)
      continue
    }
    const cells = looseCells(line)
    if (cells) grid.push(cells)
  }
  return grid
}

/** Parses the text a student pasted from SysAcad into rows. */
export function parseSysacadText(text: string): SysacadRow[] {
  return rowsFromGrid(gridFromText(text))
}

/** Most frequent plan among the rows ("" when there are none); entrance-course rows usually carry an older plan. */
export function dominantPlan(rows: ReadonlyArray<SysacadRow>): string {
  const counts = new Map<string, number>()
  for (const row of rows) {
    if (PLAN_CELL.test(row.plan)) counts.set(row.plan, (counts.get(row.plan) ?? 0) + 1)
  }
  let best = ""
  let bestCount = 0
  for (const [plan, count] of counts) {
    if (count > bestCount) {
      best = plan
      bestCount = count
    }
  }
  return best
}
