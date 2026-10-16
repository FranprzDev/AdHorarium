/**
 * Content script for SysAcad's "Estado académico" page (UTN FRT). It only runs on that page, reads the table already
 * rendered in it and turns a "Llevar a AdHorarium" link into https://adhorarium.vercel.app/importar/sysacad#data=…
 * Nothing is stored and nothing is sent anywhere: the data travels in the URL fragment, which browsers never send
 * to servers, and only when the student clicks.
 */
import { findSysacadTable } from "../../lib/sysacad/dom"
import { buildSysacadImportUrl, buildSysacadPayload } from "../../lib/sysacad/payload"
import { rowsFromGrid } from "../../lib/sysacad/table"
import type { SysacadRow } from "../../lib/sysacad/types"

export const APP_ORIGIN = "https://adhorarium.vercel.app"
export const BAR_ID = "adhorarium-sysacad-bar"
export const LINK_ID = "adhorarium-sysacad-link"

const NAVY = "#13294B"
const GOLD = "#D1A04A"
const CREAM = "#F7F4EC"

function styled<K extends keyof HTMLElementTagNameMap>(doc: Document, tag: K, style: Partial<CSSStyleDeclaration>): HTMLElementTagNameMap[K] {
  const element = doc.createElement(tag)
  Object.assign(element.style, style)
  return element
}

function buildBar(doc: Document, rows: SysacadRow[]): { bar: HTMLDivElement; link: HTMLAnchorElement } {
  const bar = styled(doc, "div", {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "12px",
    margin: "8px 0 12px",
    padding: "10px 14px",
    borderRadius: "10px",
    background: NAVY,
    color: CREAM,
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: "13px",
    lineHeight: "1.4",
  })
  bar.id = BAR_ID

  const link = styled(doc, "a", {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 14px",
    borderRadius: "8px",
    background: GOLD,
    color: NAVY,
    fontWeight: "700",
    textDecoration: "none",
    cursor: "pointer",
  })
  link.id = LINK_ID
  link.textContent = "Llevar a AdHorarium"
  link.target = "_blank"
  link.rel = "noopener noreferrer"
  link.setAttribute("aria-disabled", "true")
  link.title = "Abre AdHorarium con tus materias para que revises antes de guardar"

  const text = styled(doc, "span", { flex: "1 1 240px" })
  text.textContent = `${rows.length} materias encontradas. Se abre AdHorarium para que revises; nada se guarda hasta que confirmes.`

  bar.append(link, text)
  return { bar, link }
}

/** Adds the bar above the "Estado académico" table. Returns the link, or null when the page has no such table. */
export async function injectSysacadButton(doc: Document = document, appOrigin: string = APP_ORIGIN): Promise<HTMLAnchorElement | null> {
  if (doc.getElementById(BAR_ID)) return null
  const found = findSysacadTable(doc)
  if (!found) return null
  const rows = rowsFromGrid(found.grid)
  if (rows.length === 0) return null

  const { bar, link } = buildBar(doc, rows)
  found.table.before(bar)

  link.href = await buildSysacadImportUrl(appOrigin, buildSysacadPayload(rows))
  link.removeAttribute("aria-disabled")
  return link
}

void injectSysacadButton()
