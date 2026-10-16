"use client"

import { useState } from "react"
import { FileDown, ImageDown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { exportSchedule } from "@/lib/schedule/export"
import type { ScheduleEntry, ScheduleExportMeta } from "@/lib/schedule/types"
import { ScheduleExportFormat } from "@/types/enums"

type ExportButtonsProps = {
  entries: ReadonlyArray<ScheduleEntry>
  meta: Omit<ScheduleExportMeta, "generatedAt">
}

/** PDF (vector, A4 landscape) and PNG (300 dpi) downloads built in the browser. */
export function ExportButtons({ entries, meta }: ExportButtonsProps) {
  const [busy, setBusy] = useState<ScheduleExportFormat | null>(null)
  const isEmpty = entries.length === 0

  const handleExport = async (format: ScheduleExportFormat) => {
    setBusy(format)
    try {
      await exportSchedule(format, entries, { ...meta, generatedAt: new Date() })
      toast.success(format === ScheduleExportFormat.Pdf ? "PDF descargado" : "Imagen descargada")
    } catch (error) {
      console.error("Schedule export failed:", error)
      toast.error("No se pudo exportar el horario. Probá de nuevo.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <Button variant="outline" className="bg-card" onClick={() => void handleExport(ScheduleExportFormat.Pdf)} disabled={isEmpty || busy !== null}>
        {busy === ScheduleExportFormat.Pdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        PDF
      </Button>
      <Button variant="outline" className="bg-card" onClick={() => void handleExport(ScheduleExportFormat.Png)} disabled={isEmpty || busy !== null}>
        {busy === ScheduleExportFormat.Png ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageDown className="h-4 w-4" />}
        Imagen
      </Button>
    </>
  )
}
