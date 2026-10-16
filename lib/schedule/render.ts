import { CLASS_DAY_LABELS, CLASS_DAY_SHORT_LABELS, COMMISSION_PERIOD_LABELS } from "@/lib/schedule/labels"
import { ENTRY_COLORS, OVERLAP_COLOR, computeGridLayout, gridHours, type GridBlock } from "@/lib/schedule/layout"
import { MINUTES_PER_HOUR, formatMinutes } from "@/lib/schedule/time"
import type { ScheduleEntry, ScheduleExportMeta } from "@/lib/schedule/types"

/** Drawing surface in millimetres, implemented for jsPDF (vector PDF) and for a 2D canvas (PNG). */
export type TextAlign = "left" | "center" | "right"
export type TextStyle = { size: number; bold?: boolean; color: string; align?: TextAlign }
export type ShapeStyle = { fill?: string; stroke?: string; lineWidth?: number; radius?: number }
export type LineStyle = { color: string; width: number; dash?: ReadonlyArray<number> }

export interface SchedulePainter {
  rect(x: number, y: number, width: number, height: number, style: ShapeStyle): void
  line(x1: number, y1: number, x2: number, y2: number, style: LineStyle): void
  /** Open path with round caps and joins. */
  polyline(points: ReadonlyArray<readonly [number, number]>, style: LineStyle): void
  /** `y` is the text baseline. */
  text(value: string, x: number, y: number, style: TextStyle): void
  textWidth(value: string, style: TextStyle): number
}

/** A4 landscape in millimetres. */
export const PAGE_WIDTH_MM = 297
export const PAGE_HEIGHT_MM = 210
const MARGIN = 12
export const PT_TO_MM = 0.3528

const INK = "#13294B"
const MUTED = "#5B6577"
const RULE = "#D5DAE3"
const SOFT_RULE = "#E8EBF0"
const BRASS = "#C9973F"
const HEADER_FILL = "#F3F0E8"

/** Splits text into lines that fit `maxWidth`, adding an ellipsis when it needs more than `maxLines`. */
export function wrapText(painter: Pick<SchedulePainter, "textWidth">, value: string, style: TextStyle, maxWidth: number, maxLines: number): string[] {
  if (maxLines <= 0) return []
  const words = value.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (painter.textWidth(candidate, style) <= maxWidth || !current) {
      current = candidate
      continue
    }
    lines.push(current)
    current = word
  }
  if (current) lines.push(current)
  const fitted = lines.slice(0, maxLines)
  const truncated = lines.length > maxLines
  for (let index = 0; index < fitted.length; index++) {
    const isLast = index === fitted.length - 1
    let line = fitted[index]
    if (painter.textWidth(line, style) <= maxWidth && !(isLast && truncated)) continue
    while (line.length > 1 && painter.textWidth(`${line}...`, style) > maxWidth) line = line.slice(0, -1)
    fitted[index] = `${line.trimEnd()}...`
  }
  return fitted
}

function lineHeight(style: TextStyle): number {
  return style.size * PT_TO_MM * 1.25
}

/** AdHorarium mark (same geometry as the SVG logo, viewBox 64) drawn at `size` millimetres. */
export function drawLogoMark(painter: SchedulePainter, x: number, y: number, size: number): void {
  const scale = size / 64
  const at = (px: number, py: number) => [x + px * scale, y + py * scale] as const
  painter.rect(x, y, size, size, { fill: INK, radius: 14 * scale })
  for (const cy of [10, 26, 42]) {
    for (const cx of [10, 26, 42]) painter.rect(x + cx * scale, y + cy * scale, 12 * scale, 12 * scale, { fill: "#334562", radius: 2 * scale })
  }
  painter.polyline([at(17, 49), at(32, 15), at(47, 49)], { color: "#F7F4EC", width: 6 * scale })
  painter.polyline([at(24, 37), at(40, 37)], { color: BRASS, width: 6 * scale })
}

function formatDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`
}

function describeEntry(entry: ScheduleEntry): string {
  const slots = entry.slots.map((slot) => `${CLASS_DAY_SHORT_LABELS[slot.day]} ${slot.start}-${slot.end}${slot.classroom ? ` (${slot.classroom})` : ""}`)
  const period = entry.period ? ` · ${COMMISSION_PERIOD_LABELS[entry.period]}` : ""
  return `${entry.label}${period}: ${slots.join(", ")}`
}

function drawBlock(painter: SchedulePainter, block: GridBlock, x: number, y: number, width: number, height: number): void {
  const colors = ENTRY_COLORS[block.colorIndex]
  painter.rect(x, y, width, height, {
    fill: colors.fill,
    stroke: block.isOverlapping ? OVERLAP_COLOR : colors.border,
    lineWidth: block.isOverlapping ? 0.6 : 0.25,
    radius: 1.2,
  })
  painter.rect(x, y, 1.1, height, { fill: block.isOverlapping ? OVERLAP_COLOR : colors.border })

  const innerX = x + 2.2
  const innerWidth = width - 3.2
  const titleStyle: TextStyle = { size: 7.2, bold: true, color: colors.text }
  const detailStyle: TextStyle = { size: 6.2, color: colors.text }
  const titleLine = lineHeight(titleStyle)
  const detailLine = lineHeight(detailStyle)
  const details = [`${block.slot.start}-${block.slot.end} · ${block.label}`]
  if (block.slot.classroom) details.push(block.slot.classroom)
  if (block.isOverlapping) details.push("Superposición")

  const available = height - 2
  const detailLines = Math.max(0, Math.min(details.length, Math.floor((available - titleLine) / detailLine)))
  const titleLines = Math.max(1, Math.floor((available - detailLines * detailLine) / titleLine))
  let cursor = y + 1 + titleLine * 0.85
  for (const line of wrapText(painter, block.subjectName, titleStyle, innerWidth, titleLines)) {
    painter.text(line, innerX, cursor, titleStyle)
    cursor += titleLine
  }
  for (const detail of details.slice(0, detailLines)) {
    const style = detail === "Superposición" ? { ...detailStyle, bold: true, color: OVERLAP_COLOR } : detailStyle
    const [line] = wrapText(painter, detail, style, innerWidth, 1)
    if (line) painter.text(line, innerX, cursor, style)
    cursor += detailLine
  }
}

/** Draws the full printable timetable page: brand header, weekly grid and a legend of every entry. */
export function drawSchedulePage(painter: SchedulePainter, entries: ReadonlyArray<ScheduleEntry>, meta: ScheduleExportMeta & { siteLabel: string }): void {
  const layout = computeGridLayout(entries)
  painter.rect(0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM, { fill: "#FFFFFF" })

  drawLogoMark(painter, MARGIN, MARGIN, 12)
  painter.text("AdHorarium", MARGIN + 15, MARGIN + 6.5, { size: 17, bold: true, color: INK })
  painter.text("UTN · FRT", MARGIN + 15, MARGIN + 11, { size: 7, bold: true, color: MUTED })
  const right = PAGE_WIDTH_MM - MARGIN
  painter.text("Horario de cursado", right, MARGIN + 5, { size: 14, bold: true, color: INK, align: "right" })
  const who = [meta.studentName, meta.careerName].filter((part): part is string => Boolean(part)).join(" · ")
  painter.text(who, right, MARGIN + 9.5, { size: 8.5, color: MUTED, align: "right" })
  const generated = `Generado el ${formatDate(meta.generatedAt)}`
  const overlapNote = layout.overlapCount > 0 ? ` · ${layout.overlapCount} ${layout.overlapCount === 1 ? "superposición" : "superposiciones"}` : ""
  painter.text(`${generated}${overlapNote}`, right, MARGIN + 13.5, {
    size: 7.5,
    color: layout.overlapCount > 0 ? OVERLAP_COLOR : MUTED,
    align: "right",
  })
  painter.line(MARGIN, MARGIN + 17, right, MARGIN + 17, { color: BRASS, width: 0.5 })

  const legendStyle: TextStyle = { size: 7, color: INK }
  const legendTitleStyle: TextStyle = { size: 7, bold: true, color: INK }
  const legendColumns = entries.length > 8 ? 3 : 2
  const legendRows = Math.ceil(entries.length / legendColumns)
  const legendRowHeight = lineHeight(legendStyle) * 2 + 0.6
  const footerHeight = 6
  const legendHeight = entries.length > 0 ? legendRows * legendRowHeight + 6 : 0

  const timeColumn = 12
  const gridLeft = MARGIN + timeColumn
  const gridTop = MARGIN + 21
  const headerHeight = 7
  const gridBottom = PAGE_HEIGHT_MM - MARGIN - footerHeight - legendHeight
  const gridWidth = right - gridLeft
  const dayWidth = gridWidth / layout.days.length
  const bodyTop = gridTop + headerHeight
  const minuteHeight = (gridBottom - bodyTop) / (layout.endMinutes - layout.startMinutes)
  const yOf = (minutes: number) => bodyTop + (minutes - layout.startMinutes) * minuteHeight

  painter.rect(gridLeft, gridTop, gridWidth, headerHeight, { fill: HEADER_FILL })
  layout.days.forEach((day, index) => {
    painter.text(CLASS_DAY_LABELS[day], gridLeft + dayWidth * (index + 0.5), gridTop + 4.8, { size: 8.5, bold: true, color: INK, align: "center" })
  })
  for (const minutes of gridHours(layout)) {
    const y = yOf(minutes)
    painter.line(gridLeft, y, right, y, { color: RULE, width: 0.2 })
    painter.text(formatMinutes(minutes), gridLeft - 1.5, y + 1, { size: 6.5, color: MUTED, align: "right" })
    const half = minutes + MINUTES_PER_HOUR / 2
    if (half < layout.endMinutes) painter.line(gridLeft, yOf(half), right, yOf(half), { color: SOFT_RULE, width: 0.15, dash: [0.8, 0.8] })
  }
  for (let index = 0; index <= layout.days.length; index++) {
    const x = gridLeft + dayWidth * index
    painter.line(x, gridTop, x, gridBottom, { color: RULE, width: 0.2 })
  }
  painter.rect(gridLeft, gridTop, gridWidth, gridBottom - gridTop, { stroke: RULE, lineWidth: 0.3 })

  for (const block of layout.blocks) {
    const columnWidth = dayWidth / block.columns
    const x = gridLeft + dayWidth * block.dayIndex + columnWidth * block.column + 0.6
    const y = yOf(block.startMinutes) + 0.3
    drawBlock(painter, block, x, y, columnWidth - 1.2, yOf(block.endMinutes) - yOf(block.startMinutes) - 0.6)
  }

  if (entries.length > 0) {
    const legendTop = gridBottom + 5
    const columnWidth = (right - MARGIN) / legendColumns
    entries.forEach((entry, index) => {
      const column = Math.floor(index / legendRows)
      const row = index % legendRows
      const x = MARGIN + column * columnWidth
      const y = legendTop + row * legendRowHeight
      const colors = ENTRY_COLORS[index % ENTRY_COLORS.length]
      painter.rect(x, y - 2.2, 2.6, 2.6, { fill: colors.fill, stroke: colors.border, lineWidth: 0.25, radius: 0.5 })
      const [title] = wrapText(painter, entry.subjectName, legendTitleStyle, columnWidth - 8, 1)
      painter.text(title ?? "", x + 4, y, legendTitleStyle)
      const [detail] = wrapText(painter, describeEntry(entry), { ...legendStyle, color: MUTED }, columnWidth - 8, 1)
      painter.text(detail ?? "", x + 4, y + lineHeight(legendStyle), { ...legendStyle, color: MUTED })
    })
  }

  painter.text(`Generado con AdHorarium · ${meta.siteLabel}`, MARGIN, PAGE_HEIGHT_MM - MARGIN + 2, { size: 6.5, color: MUTED })
  painter.text("Los horarios provienen del catálogo de comisiones o fueron cargados por el estudiante.", right, PAGE_HEIGHT_MM - MARGIN + 2, {
    size: 6.5,
    color: MUTED,
    align: "right",
  })
}

