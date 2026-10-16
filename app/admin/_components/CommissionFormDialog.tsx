"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { createCommissionAction, updateCommissionAction } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EMPTY_SLOT, SlotsEditor } from "@/components/schedule/slots-editor"
import { isEnumValue } from "@/lib/admin/labels"
import { COMMISSION_PERIOD_LABELS, COMMISSION_SHIFT_LABELS } from "@/lib/schedule/labels"
import type { AdminCommission } from "@/lib/schedule/types"
import { MAX_COMMISSION_NAME_LENGTH, commissionFieldsSchema, type ClassSlotInput } from "@/lib/schedule/validation"
import { CommissionPeriod, CommissionShift } from "@/types/enums"

type CommissionFormDialogProps = {
  subjectId: number
  subjectName: string
  commission: AdminCommission | null
  onClose: () => void
  onSaved: () => Promise<void>
}

/** Create or edit a commission: name, shift, period and its weekly slots. */
export function CommissionFormDialog({ subjectId, subjectName, commission, onClose, onSaved }: CommissionFormDialogProps) {
  const [name, setName] = useState(commission?.name ?? "")
  const [shift, setShift] = useState<CommissionShift>(commission?.shift ?? CommissionShift.Manana)
  const [period, setPeriod] = useState<CommissionPeriod>(commission?.period ?? CommissionPeriod.Anual)
  const [slots, setSlots] = useState<ClassSlotInput[]>(commission?.slots ?? [EMPTY_SLOT])
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = commission !== null

  const submit = async () => {
    const parsed = commissionFieldsSchema.safeParse({ name, shift, period, slots })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisá los datos")
      return
    }
    setError(null)
    setIsSaving(true)
    const result = commission
      ? await updateCommissionAction({ id: commission.id, ...parsed.data })
      : await createCommissionAction({ subjectId, ...parsed.data })
    setIsSaving(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    await onSaved()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Editar comisión ${commission.name}` : "Nueva comisión"}</DialogTitle>
          <DialogDescription>
            {subjectName}.{" "}
            {isEditing && commission.entryCount > 0
              ? `Los cambios se verán al instante en ${commission.entryCount} ${commission.entryCount === 1 ? "horario" : "horarios"} de estudiantes.`
              : "Los estudiantes la van a ver al armar su horario."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="commission-name">Nombre</Label>
              <Input
                id="commission-name"
                value={name}
                maxLength={MAX_COMMISSION_NAME_LENGTH}
                placeholder="1K1"
                onChange={(event) => setName(event.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="commission-shift">Turno</Label>
              <Select
                value={shift}
                onValueChange={(value) => {
                  if (isEnumValue(CommissionShift, value)) setShift(value)
                }}
              >
                <SelectTrigger id="commission-shift" className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CommissionShift).map((value) => (
                    <SelectItem key={value} value={value}>
                      {COMMISSION_SHIFT_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="commission-period">Período</Label>
              <Select
                value={period}
                onValueChange={(value) => {
                  if (isEnumValue(CommissionPeriod, value)) setPeriod(value)
                }}
              >
                <SelectTrigger id="commission-period" className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CommissionPeriod).map((value) => (
                    <SelectItem key={value} value={value}>
                      {COMMISSION_PERIOD_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SlotsEditor slots={slots} onChange={setSlots} idPrefix="commission" />
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Guardar cambios" : "Crear comisión"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
