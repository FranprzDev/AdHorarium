/**
 * Shared types for the SysAcad (UTN FRT) academic record import. This module has no dependencies so the browser
 * extension can bundle it together with the parser.
 */

/** Version of the payload the extension hands to the app. Bump it on any breaking change of `SysacadPayload`. */
export const SYSACAD_PAYLOAD_VERSION = 1

/** Origin of a payload; only the UTN FRT SysAcad layout is supported today. */
export enum SysacadSource {
  FrtSysacad = "sysacad-frt",
}

/** State of a subject as written in the "Estado" column of SysAcad's "Estado académico" page. */
export enum SysacadRowStatus {
  /** "Aprobada en 2022" or "Aprobada con 8 (5 hs.) Tomo: 725 Folio: 156". */
  Approved = "approved",
  /** "Regular en 2023" or "Regular en 2024 (2C)". */
  Regular = "regular",
  /** "Cursa en 4K01 Aula 157 Casa Central". */
  Enrolled = "enrolled",
  /** Empty cell: the subject has no state yet. */
  None = "none",
  /** Text this parser does not recognise; kept so the student can see it. */
  Unknown = "unknown",
}

/** Fragment keys used in `/importar/sysacad#<key>=<base64url>`. */
export enum SysacadFragmentKey {
  /** Plain JSON, base64url encoded. */
  Plain = "data",
  /** JSON compressed with `deflate-raw`, then base64url encoded. */
  Deflated = "dataz",
}

/** One row of the SysAcad table, already interpreted. Optional fields are omitted (not null) to keep payloads small. */
export type SysacadRow = {
  /** Career year ("Año"); 0 is the entrance course. */
  year: number
  /** Subject name as shown, possibly cut by the column width. */
  name: string
  /** Plan year ("Plan"), e.g. "2023". */
  plan: string
  status: SysacadRowStatus
  /** Final grade, only for "Aprobada con N". */
  grade?: number
  approvedYear?: number
  regularYear?: number
  /** Term qualifier of a regular subject, e.g. "1C". */
  term?: string
  /** Commission code of a subject being taken, e.g. "4K01". */
  commission?: string
  /** Original text, only for `SysacadRowStatus.Unknown`. */
  raw?: string
}

export type SysacadPayload = {
  v: typeof SYSACAD_PAYLOAD_VERSION
  source: SysacadSource
  /** ISO 8601 timestamp of the capture. */
  capturedAt: string
  /** Most common plan among the rows, e.g. "2023". */
  plan: string
  rows: SysacadRow[]
}

/** Parsed "Estado" cell without the row context. */
export type SysacadStatusInfo = Pick<SysacadRow, "status" | "grade" | "approvedYear" | "regularYear" | "term" | "commission" | "raw">
