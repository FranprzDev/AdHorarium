import { createCanvasPainter, createPdfPainter } from "@/lib/schedule/painters"
import { PAGE_HEIGHT_MM, PAGE_WIDTH_MM, drawSchedulePage } from "@/lib/schedule/render"
import type { ScheduleEntry, ScheduleExportMeta } from "@/lib/schedule/types"
import { ScheduleExportFormat } from "@/types/enums"

/** ~300 dpi at A4: 3508 × 2480 px. */
const PNG_PIXELS_PER_MM = 11.81
const PNG_FONT_STACK = "Helvetica, Arial, sans-serif"

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function exportFileName(meta: ScheduleExportMeta, format: ScheduleExportFormat): string {
  const date = meta.generatedAt.toISOString().slice(0, 10)
  const owner = meta.studentName ? `-${slugify(meta.studentName)}` : ""
  return `horario${owner}-${date}.${format}`
}

function siteLabel(): string {
  return window.location.host
}

function download(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function buildSchedulePdf(entries: ReadonlyArray<ScheduleEntry>, meta: ScheduleExportMeta): Promise<Blob> {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true })
  doc.setProperties({ title: "Horario de cursado", subject: meta.careerName, creator: "AdHorarium" })
  drawSchedulePage(createPdfPainter(doc), entries, { ...meta, siteLabel: siteLabel() })
  return doc.output("blob")
}

export async function buildSchedulePng(entries: ReadonlyArray<ScheduleEntry>, meta: ScheduleExportMeta): Promise<Blob> {
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(PAGE_WIDTH_MM * PNG_PIXELS_PER_MM)
  canvas.height = Math.round(PAGE_HEIGHT_MM * PNG_PIXELS_PER_MM)
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Tu navegador no permite generar imágenes")
  drawSchedulePage(createCanvasPainter(context, PNG_PIXELS_PER_MM, PNG_FONT_STACK), entries, { ...meta, siteLabel: siteLabel() })
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
  if (!blob) throw new Error("No se pudo generar la imagen")
  return blob
}

/** Builds the file in the browser and downloads it. */
export async function exportSchedule(format: ScheduleExportFormat, entries: ReadonlyArray<ScheduleEntry>, meta: ScheduleExportMeta): Promise<void> {
  const blob = format === ScheduleExportFormat.Pdf ? await buildSchedulePdf(entries, meta) : await buildSchedulePng(entries, meta)
  download(blob, exportFileName(meta, format))
}
