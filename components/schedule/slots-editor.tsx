"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isEnumValue } from "@/lib/admin/labels"
import { CLASS_DAYS, CLASS_DAY_LABELS } from "@/lib/schedule/labels"
import { MAX_CLASSROOM_LENGTH, MAX_SLOTS_PER_ENTRY, type ClassSlotInput } from "@/lib/schedule/validation"
import { ClassDay } from "@/types/enums"

export const EMPTY_SLOT: ClassSlotInput = { day: ClassDay.Lunes, start: "08:00", end: "10:00", classroom: null }

type SlotsEditorProps = {
  slots: ClassSlotInput[]
  onChange: (slots: ClassSlotInput[]) => void
  idPrefix: string
}

/** Editable list of weekly slots (day, start, end, optional classroom). */
export function SlotsEditor({ slots, onChange, idPrefix }: SlotsEditorProps) {
  const update = (index: number, patch: Partial<ClassSlotInput>) => {
    onChange(slots.map((slot, current) => (current === index ? { ...slot, ...patch } : slot)))
  }
  const remove = (index: number) => onChange(slots.filter((_, current) => current !== index))
  const add = () => {
    const last = slots[slots.length - 1]
    onChange([...slots, last ? { ...last, classroom: last.classroom } : EMPTY_SLOT])
  }

  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 text-sm font-medium text-foreground">Días y horarios</legend>
      {slots.map((slot, index) => (
        <div key={index} className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-[1.2fr_1fr_1fr_1.3fr_auto] sm:items-end">
          <div className="space-y-1">
            <label htmlFor={`${idPrefix}-day-${index}`} className="text-xs text-muted-foreground">
              Día
            </label>
            <Select value={slot.day} onValueChange={(value) => {
                if (isEnumValue(ClassDay, value)) update(index, { day: value })
              }}>
              <SelectTrigger id={`${idPrefix}-day-${index}`} className="h-9 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLASS_DAYS.map((day) => (
                  <SelectItem key={day} value={day}>
                    {CLASS_DAY_LABELS[day]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor={`${idPrefix}-start-${index}`} className="text-xs text-muted-foreground">
              Inicio
            </label>
            <Input
              id={`${idPrefix}-start-${index}`}
              type="time"
              step={300}
              value={slot.start}
              onChange={(event) => update(index, { start: event.target.value })}
              className="h-9 bg-background"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={`${idPrefix}-end-${index}`} className="text-xs text-muted-foreground">
              Fin
            </label>
            <Input
              id={`${idPrefix}-end-${index}`}
              type="time"
              step={300}
              value={slot.end}
              onChange={(event) => update(index, { end: event.target.value })}
              className="h-9 bg-background"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={`${idPrefix}-room-${index}`} className="text-xs text-muted-foreground">
              Aula (opcional)
            </label>
            <Input
              id={`${idPrefix}-room-${index}`}
              value={slot.classroom ?? ""}
              maxLength={MAX_CLASSROOM_LENGTH}
              placeholder="Aula 12"
              onChange={(event) => update(index, { classroom: event.target.value })}
              className="h-9 bg-background"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 justify-self-end text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => remove(index)}
            disabled={slots.length === 1}
            aria-label={`Quitar horario ${index + 1}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} disabled={slots.length >= MAX_SLOTS_PER_ENTRY}>
        <Plus className="h-4 w-4" />
        Agregar día
      </Button>
    </fieldset>
  )
}
