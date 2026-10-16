import { SysacadMatchMethod } from "./match"
import { SysacadChangeKind } from "./plan"
import { SysacadRowStatus, type SysacadRow } from "./types"

/** GitHub release that ships the browser extension. */
export const EXTENSION_RELEASE_TAG = "extension-v0.1.0"
export const EXTENSION_RELEASE_URL = `https://github.com/FranprzDev/AdHorarium/releases/tag/${EXTENSION_RELEASE_TAG}`
export const EXTENSION_CHROME_ZIP_URL = `https://github.com/FranprzDev/AdHorarium/releases/download/${EXTENSION_RELEASE_TAG}/adhorarium-sysacad-chrome.zip`
export const EXTENSION_FIREFOX_ZIP_URL = `https://github.com/FranprzDev/AdHorarium/releases/download/${EXTENSION_RELEASE_TAG}/adhorarium-sysacad-firefox.zip`
export const SYSACAD_ACADEMIC_STATE_URL = "https://sysacad.frt.utn.edu.ar/"

/** Short label of what the import does to a subject. */
export const SYSACAD_CHANGE_LABELS: Record<SysacadChangeKind, string> = {
  [SysacadChangeKind.New]: "Nueva",
  [SysacadChangeKind.Upgrade]: "Avanza",
  [SysacadChangeKind.GradeFill]: "Agrega nota",
  [SysacadChangeKind.GradeChange]: "Cambia la nota",
  [SysacadChangeKind.Downgrade]: "Baja de estado",
  [SysacadChangeKind.Unchanged]: "Sin cambios",
  [SysacadChangeKind.Kept]: "Se mantiene la tuya",
}

/** Explains to the student why a row needs a look. Null when the match is reliable. */
export const SYSACAD_MATCH_HINTS: Record<SysacadMatchMethod, string | null> = {
  [SysacadMatchMethod.Exact]: null,
  [SysacadMatchMethod.Prefix]: null,
  [SysacadMatchMethod.Fuzzy]: "El nombre no coincide exacto: revisá que sea la misma materia.",
  [SysacadMatchMethod.Ambiguous]: "Hay varias materias posibles: elegí la que corresponde.",
  [SysacadMatchMethod.Unmatched]: "No está en tu plan de AdHorarium (por ejemplo, una electiva).",
  [SysacadMatchMethod.EntranceCourse]: "Es del curso de ingreso, que no forma parte del plan.",
  [SysacadMatchMethod.OtherPlanEquivalent]: "Es de otro plan: la asociamos por tener el mismo nombre. Revisá que sea equivalente.",
  [SysacadMatchMethod.OtherPlan]: "Es de otro plan y no tiene una equivalente clara: elegila a mano o dejala sin importar.",
}

/** Methods that are imported without asking; every other row is listed under "Para revisar". */
export const RELIABLE_MATCH_METHODS: ReadonlySet<SysacadMatchMethod> = new Set([SysacadMatchMethod.Exact, SysacadMatchMethod.Prefix])

/** Human text of a SysAcad state, rebuilt from the parsed row. */
export function describeSysacadRow(row: SysacadRow): string {
  switch (row.status) {
    case SysacadRowStatus.Approved:
      if (row.grade !== undefined) return `Aprobada con ${row.grade}`
      return row.approvedYear !== undefined ? `Aprobada en ${row.approvedYear}` : "Aprobada"
    case SysacadRowStatus.Regular: {
      const year = row.regularYear !== undefined ? ` en ${row.regularYear}` : ""
      return `Regular${year}${row.term ? ` (${row.term})` : ""}`
    }
    case SysacadRowStatus.Enrolled:
      return row.commission ? `Cursando en ${row.commission}` : "Cursando"
    case SysacadRowStatus.None:
      return "Sin estado"
    case SysacadRowStatus.Unknown:
      return row.raw ?? "Estado desconocido"
  }
}
