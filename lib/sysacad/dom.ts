import { detectColumns } from "./table"

/** Text of every cell of a table row, as rendered (innerText keeps line breaks out of the way of the parser). */
function cellTexts(row: HTMLTableRowElement): string[] {
  const cells: string[] = []
  for (const cell of Array.from(row.cells)) cells.push(cell.innerText ?? cell.textContent ?? "")
  return cells
}

export type SysacadTable = { table: HTMLTableElement; grid: string[][] }

/**
 * Finds the "Estado académico" table in a SysAcad document (the one whose header has Año, Materia, Estado and
 * Plan, in any order) and returns it with its rows as cell texts, header included. Null when there is no such table.
 */
export function findSysacadTable(root: ParentNode): SysacadTable | null {
  for (const table of Array.from(root.querySelectorAll("table"))) {
    const rows = Array.from(table.rows)
    // `table.rows` only lists the table's own rows, so outer layout tables never match the header.
    const headerIndex = rows.findIndex((row) => detectColumns(cellTexts(row)) !== null)
    if (headerIndex === -1) continue
    return { table, grid: rows.slice(headerIndex).map(cellTexts) }
  }
  return null
}
