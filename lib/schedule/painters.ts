import type { jsPDF } from "jspdf"
import { PT_TO_MM, type LineStyle, type SchedulePainter, type ShapeStyle, type TextStyle } from "@/lib/schedule/render"

/** Vector painter: every shape and text stays selectable and sharp in the PDF. */
export function createPdfPainter(doc: jsPDF): SchedulePainter {
  const setFont = (style: TextStyle) => {
    doc.setFont("helvetica", style.bold ? "bold" : "normal")
    doc.setFontSize(style.size)
  }
  return {
    rect(x, y, width, height, style: ShapeStyle) {
      if (style.fill) doc.setFillColor(style.fill)
      if (style.stroke) {
        doc.setDrawColor(style.stroke)
        doc.setLineWidth(style.lineWidth ?? 0.2)
      }
      const mode = style.fill && style.stroke ? "FD" : style.fill ? "F" : "S"
      if (style.radius) doc.roundedRect(x, y, width, height, style.radius, style.radius, mode)
      else doc.rect(x, y, width, height, mode)
    },
    line(x1, y1, x2, y2, style: LineStyle) {
      doc.setDrawColor(style.color)
      doc.setLineWidth(style.width)
      doc.setLineDashPattern(style.dash ? [...style.dash] : [], 0)
      doc.line(x1, y1, x2, y2)
      doc.setLineDashPattern([], 0)
    },
    polyline(points, style: LineStyle) {
      doc.setDrawColor(style.color)
      doc.setLineWidth(style.width)
      doc.setLineCap("round")
      doc.setLineJoin("round")
      for (let index = 1; index < points.length; index++) {
        const [x1, y1] = points[index - 1]
        const [x2, y2] = points[index]
        doc.line(x1, y1, x2, y2)
      }
      doc.setLineCap("butt")
      doc.setLineJoin("miter")
    },
    text(value, x, y, style) {
      setFont(style)
      doc.setTextColor(style.color)
      doc.text(value, x, y, { align: style.align ?? "left", baseline: "alphabetic" })
    },
    textWidth(value, style) {
      setFont(style)
      return doc.getTextWidth(value)
    },
  }
}

/** Raster painter in millimetres scaled to `pixelsPerMm`, for a crisp PNG. */
export function createCanvasPainter(context: CanvasRenderingContext2D, pixelsPerMm: number, fontFamily: string): SchedulePainter {
  const font = (style: TextStyle) => `${style.bold ? 700 : 400} ${style.size * PT_TO_MM * pixelsPerMm}px ${fontFamily}`
  const k = pixelsPerMm
  return {
    rect(x, y, width, height, style) {
      context.beginPath()
      if (style.radius) context.roundRect(x * k, y * k, width * k, height * k, style.radius * k)
      else context.rect(x * k, y * k, width * k, height * k)
      if (style.fill) {
        context.fillStyle = style.fill
        context.fill()
      }
      if (style.stroke) {
        context.strokeStyle = style.stroke
        context.lineWidth = (style.lineWidth ?? 0.2) * k
        context.stroke()
      }
    },
    line(x1, y1, x2, y2, style) {
      context.beginPath()
      context.setLineDash(style.dash ? style.dash.map((value) => value * k) : [])
      context.strokeStyle = style.color
      context.lineWidth = style.width * k
      context.moveTo(x1 * k, y1 * k)
      context.lineTo(x2 * k, y2 * k)
      context.stroke()
      context.setLineDash([])
    },
    polyline(points, style) {
      context.beginPath()
      context.strokeStyle = style.color
      context.lineWidth = style.width * k
      context.lineCap = "round"
      context.lineJoin = "round"
      points.forEach(([x, y], index) => (index === 0 ? context.moveTo(x * k, y * k) : context.lineTo(x * k, y * k)))
      context.stroke()
      context.lineCap = "butt"
      context.lineJoin = "miter"
    },
    text(value, x, y, style) {
      context.font = font(style)
      context.fillStyle = style.color
      context.textAlign = style.align ?? "left"
      context.textBaseline = "alphabetic"
      context.fillText(value, x * k, y * k)
    },
    textWidth(value, style) {
      context.font = font(style)
      return context.measureText(value).width / k
    },
  }
}
