"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertCircle, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteCommissionAction, listSubjectCommissionsAction } from "@/app/actions/admin"
import type { AdminSubject } from "@/db/queries/admin"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CLASS_DAY_SHORT_LABELS, COMMISSION_PERIOD_LABELS, COMMISSION_SHIFT_LABELS } from "@/lib/schedule/labels"
import type { AdminCommission } from "@/lib/schedule/types"
import { BadgeVariant } from "@/types/enums"
import { CommissionFormDialog } from "./CommissionFormDialog"

type CommissionsDialogProps = {
  subject: AdminSubject
  onClose: () => void
}

type Editing = { commission: AdminCommission | null } | null

/** Lists, creates, edits and deletes the commissions (class times) of a subject. */
export function CommissionsDialog({ subject, onClose }: CommissionsDialogProps) {
  const [commissions, setCommissions] = useState<AdminCommission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Editing>(null)
  const [deleting, setDeleting] = useState<AdminCommission | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const result = await listSubjectCommissionsAction(subject.id)
    if (result.ok) {
      setCommissions(result.data)
      setError(null)
    } else {
      setError(result.error)
    }
    setIsLoading(false)
  }, [subject.id])

  useEffect(() => {
    void load()
  }, [load])

  const handleSaved = async () => {
    const wasEditing = editing?.commission ?? null
    setEditing(null)
    await load()
    toast.success(wasEditing ? `Comisión ${wasEditing.name} actualizada` : "Comisión creada")
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setIsDeleting(true)
    const result = await deleteCommissionAction({ commissionId: deleting.id, detachEntries: deleting.entryCount > 0 })
    setIsDeleting(false)
    if (!result.ok) {
      toast.error("No se pudo eliminar la comisión", { description: result.error })
      return
    }
    toast.success(
      `Comisión ${deleting.name} eliminada`,
      result.data > 0 ? { description: `${result.data} ${result.data === 1 ? "horario pasó" : "horarios pasaron"} a ser manuales.` } : undefined,
    )
    setDeleting(null)
    await load()
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comisiones y horarios</DialogTitle>
            <DialogDescription>
              {subject.name} · Nivel {subject.level} · {subject.careerName}. Cargá solo horarios oficiales o comisiones de ejemplo
              claramente identificadas.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button size="sm" onClick={() => setEditing({ commission: null })}>
              <Plus className="h-4 w-4" />
              Nueva comisión
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando comisiones...
            </p>
          ) : commissions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Esta materia todavía no tiene comisiones. Los estudiantes pueden cargar sus horarios a mano mientras tanto.
            </p>
          ) : (
            <ul className="space-y-2">
              {commissions.map((commission) => (
                <li key={commission.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-foreground">{commission.name}</span>
                      <Badge variant={BadgeVariant.Outline} className="font-normal">
                        {COMMISSION_SHIFT_LABELS[commission.shift]}
                      </Badge>
                      <Badge variant={BadgeVariant.Outline} className="font-normal">
                        {COMMISSION_PERIOD_LABELS[commission.period]}
                      </Badge>
                      <Badge variant={BadgeVariant.Secondary} className="font-normal">
                        {commission.entryCount} {commission.entryCount === 1 ? "estudiante" : "estudiantes"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {commission.slots
                        .map((slot) => `${CLASS_DAY_SHORT_LABELS[slot.day]} ${slot.start}–${slot.end}${slot.classroom ? ` (${slot.classroom})` : ""}`)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar"
                      aria-label={`Editar comisión ${commission.name}`}
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setEditing({ commission })}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Eliminar"
                      aria-label={`Eliminar comisión ${commission.name}`}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleting(commission)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {editing && (
        <CommissionFormDialog
          subjectId={subject.id}
          subjectName={subject.name}
          commission={editing.commission}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {deleting && (
        <AlertDialog open onOpenChange={(open) => !open && setDeleting(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar la comisión {deleting.name}?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                {deleting.entryCount > 0
                  ? `${deleting.entryCount} ${deleting.entryCount === 1 ? "estudiante la tiene" : "estudiantes la tienen"} en su horario. No van a perder la materia: sus horarios pasan a ser manuales con los días y horas actuales de esta comisión.`
                  : "Ningún estudiante la tiene en su horario."}{" "}
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <Button variant="destructive" onClick={() => void confirmDelete()} disabled={isDeleting}>
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {deleting.entryCount > 0 ? "Eliminar y convertir horarios" : "Eliminar"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
