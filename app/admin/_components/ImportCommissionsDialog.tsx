"use client"

import { useState, type ChangeEvent } from "react"
import { AlertCircle, AlertTriangle, Download, FileUp, Loader2, ScanSearch, Upload } from "lucide-react"
import { toast } from "sonner"
import { applyCommissionImportAction, previewCommissionImportAction } from "@/app/actions/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { COMMISSION_PERIOD_LABELS } from "@/lib/schedule/labels"
import { formatSlot, IMPORT_COLUMNS, type CommissionImportPlan } from "@/lib/schedule/commission-import"
import { BadgeVariant, CommissionImportStatus, ImportIssueLevel } from "@/types/enums"

type ImportCommissionsDialogProps = {
  onClose: () => void
}

const STATUS_LABELS: Record<CommissionImportStatus, string> = {
  [CommissionImportStatus.Create]: "Nueva",
  [CommissionImportStatus.Update]: "Con cambios",
  [CommissionImportStatus.Unchanged]: "Sin cambios",
}

const STATUS_VARIANTS: Record<CommissionImportStatus, BadgeVariant> = {
  [CommissionImportStatus.Create]: BadgeVariant.Default,
  [CommissionImportStatus.Update]: BadgeVariant.Secondary,
  [CommissionImportStatus.Unchanged]: BadgeVariant.Outline,
}

const TEMPLATE_ROW = [
  "ISI",
  "2023",
  "9",
  "Análisis Matemático II",
  "2K01",
  "manana",
  "anual",
  "lunes",
  "08:00",
  "09:30",
  "212",
  "2.º cuatrimestre 2026",
  "Departamento de Sistemas UTN-FRT",
  "https://sistemasfrtutn.ar/horarios/",
]

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

function downloadTemplate(): void {
  const csv = `${IMPORT_COLUMNS.join(",")}\n${TEMPLATE_ROW.map((value) => (value.includes(",") ? `"${value}"` : value)).join(",")}\n`
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const link = document.createElement("a")
  link.href = url
  link.download = "plantilla-comisiones.csv"
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Bulk load of official commissions: paste or pick a CSV/JSON file, preview the differences, then import. */
export function ImportCommissionsDialog({ onClose }: ImportCommissionsDialogProps) {
  const [content, setContent] = useState("")
  const [plan, setPlan] = useState<CommissionImportPlan | null>(null)
  const [previewedContent, setPreviewedContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const errors = plan ? plan.issues.filter((issue) => issue.level === ImportIssueLevel.Error) : []
  const warnings = plan ? plan.issues.filter((issue) => issue.level === ImportIssueLevel.Warning) : []
  const pending = plan ? plan.counts[CommissionImportStatus.Create] + plan.counts[CommissionImportStatus.Update] : 0
  const isStale = plan !== null && previewedContent !== content

  const preview = async (text: string) => {
    setIsPreviewing(true)
    const result = await previewCommissionImportAction({ content: text })
    setIsPreviewing(false)
    if (!result.ok) {
      setPlan(null)
      setError(result.error)
      return
    }
    setError(null)
    setPlan(result.data)
    setPreviewedContent(text)
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    const text = await file.text()
    setContent(text)
    await preview(text)
  }

  const runImport = async () => {
    setIsImporting(true)
    const result = await applyCommissionImportAction({ content })
    setIsImporting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    const { created, updated } = result.data
    toast.success(countLabel(created + updated, "comisión importada", "comisiones importadas"), {
      description: `${countLabel(created, "nueva", "nuevas")} · ${countLabel(updated, "actualizada", "actualizadas")}`,
    })
    await preview(content)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importar comisiones</DialogTitle>
          <DialogDescription>
            Pegá o elegí un archivo CSV o JSON con una fila por clase semanal. Antes de guardar vas a ver qué comisiones se crean y
            cuáles cambian: una comisión existente (misma materia, nombre y período) se actualiza y los estudiantes que la eligieron
            ven los horarios nuevos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="commission-import-content">Contenido CSV o JSON</Label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={downloadTemplate}>
                <Download className="h-4 w-4" />
                Plantilla CSV
              </Button>
              <Button type="button" size="sm" variant="outline" asChild>
                <label htmlFor="commission-import-file" className="cursor-pointer">
                  <FileUp className="h-4 w-4" />
                  Elegir archivo
                </label>
              </Button>
              <input
                id="commission-import-file"
                type="file"
                accept=".csv,.json,text/csv,application/json"
                className="sr-only"
                aria-label="Archivo de comisiones"
                onChange={(event) => void handleFile(event)}
              />
            </div>
          </div>
          <Textarea
            id="commission-import-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={8}
            spellCheck={false}
            className="font-mono text-xs"
            placeholder={IMPORT_COLUMNS.join(",")}
          />
          <p className="text-xs text-muted-foreground">
            Columnas: {IMPORT_COLUMNS.join(", ")}. La materia se identifica por carrera, plan y número; si incluís el nombre, se
            controla que coincida.
          </p>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {plan && (
          <section aria-label="Vista previa de la importación" className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5 text-sm">
              <span className="font-medium text-foreground">Vista previa:</span>
              <Badge variant={BadgeVariant.Default}>{countLabel(plan.counts[CommissionImportStatus.Create], "nueva", "nuevas")}</Badge>
              <Badge variant={BadgeVariant.Secondary}>{plan.counts[CommissionImportStatus.Update]} con cambios</Badge>
              <Badge variant={BadgeVariant.Outline}>{plan.counts[CommissionImportStatus.Unchanged]} sin cambios</Badge>
              {errors.length > 0 && <Badge variant={BadgeVariant.Destructive}>{countLabel(errors.length, "error", "errores")}</Badge>}
              {warnings.length > 0 && <Badge variant={BadgeVariant.Outline}>{countLabel(warnings.length, "advertencia", "advertencias")}</Badge>}
              <span className="text-xs text-muted-foreground">
                {countLabel(plan.rowCount, "fila", "filas")} · {plan.format.toUpperCase()}
              </span>
            </div>
            {isStale && <p className="text-xs text-muted-foreground">Modificaste el contenido: volvé a previsualizar antes de importar.</p>}

            {plan.issues.length > 0 && (
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-3 text-xs">
                {plan.issues.map((issue, index) => (
                  <li
                    key={`${issue.level}-${index}`}
                    className={issue.level === ImportIssueLevel.Error ? "flex gap-1.5 text-destructive" : "flex gap-1.5 text-amber-700 dark:text-amber-400"}
                  >
                    {issue.level === ImportIssueLevel.Error ? (
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-label="Error" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-label="Advertencia" />
                    )}
                    {issue.message}
                  </li>
                ))}
              </ul>
            )}

            {plan.items.length > 0 && (
              <ul className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
                {plan.items.map((item) => (
                  <li key={item.key} className="rounded-lg border border-border p-2.5 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={STATUS_VARIANTS[item.status]} className="font-normal">
                        {STATUS_LABELS[item.status]}
                      </Badge>
                      <span className="font-semibold text-foreground">{item.name}</span>
                      <span className="text-foreground">{item.subjectName}</span>
                      <span className="text-muted-foreground">
                        {item.career} {item.plan} · {COMMISSION_PERIOD_LABELS[item.period]}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{item.slots.map(formatSlot).join(" · ")}</p>
                    {item.changes.map((change) => (
                      <p key={change} className="mt-0.5 text-foreground">
                        {change}
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="button" variant="secondary" onClick={() => void preview(content)} disabled={isPreviewing || isImporting || content.trim().length === 0}>
            {isPreviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
            Previsualizar
          </Button>
          <Button type="button" onClick={() => void runImport()} disabled={!plan?.canApply || isStale || isImporting || isPreviewing}>
            {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {pending > 0 ? `Importar ${countLabel(pending, "comisión", "comisiones")}` : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
