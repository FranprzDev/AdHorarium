"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EMPTY_SLOT, SlotsEditor } from "@/components/schedule/slots-editor"
import type { ActionResult } from "@/lib/action-result"
import type { ClassSlot } from "@/lib/schedule/types"
import { MAX_COMMISSION_NAME_LENGTH, customEntryFieldsSchema, type ClassSlotInput } from "@/lib/schedule/validation"

export type CustomEntryValues = { label: string; slots: ClassSlot[] }

type CustomEntryDialogProps = {
  subjectName: string
  initial: { label: string; slots: ClassSlotInput[] } | null
  onClose: () => void
  onSubmit: (values: CustomEntryValues) => Promise<ActionResult<null>>
}

/** Manual slots for a subject without commissions in the catalog (or to edit an existing manual entry). */
export function CustomEntryDialog({ subjectName, initial, onClose, onSubmit }: CustomEntryDialogProps) {
  const [label, setLabel] = useState(initial?.label ?? "")
  const [slots, setSlots] = useState<ClassSlotInput[]>(initial?.slots ?? [EMPTY_SLOT])
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const submit = async () => {
    const parsed = customEntryFieldsSchema.safeParse({ label, slots })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisá los datos")
      return
    }
    setError(null)
    setIsSaving(true)
    const result = await onSubmit(parsed.data)
    setIsSaving(false)
    if (!result.ok) setError(result.error)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">{initial ? "Editar horario manual" : "Cargar horario manual"}</DialogTitle>
          <DialogDescription>
            {subjectName}. Copiá los días y horas de la comisión desde la información oficial de la facultad.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="custom-entry-label">Comisión</Label>
            <Input
              id="custom-entry-label"
              value={label}
              maxLength={MAX_COMMISSION_NAME_LENGTH}
              placeholder="Por ejemplo: 3K2"
              onChange={(event) => setLabel(event.target.value)}
            />
          </div>
          <SlotsEditor slots={slots} onChange={setSlots} idPrefix="custom-entry" />
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
