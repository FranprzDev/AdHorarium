"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, Loader2, PenLine, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { canTakeSubject, getSubjectStatus } from "@/lib/assistant/eligibility"
import { CLASS_DAY_SHORT_LABELS, COMMISSION_PERIOD_LABELS, COMMISSION_SHIFT_LABELS } from "@/lib/schedule/labels"
import { commissionClashes } from "@/lib/schedule/overlaps"
import type { Commission, ScheduleEntry } from "@/lib/schedule/types"
import { BadgeVariant, ScheduleEntryKind, SubjectStatus } from "@/types/enums"
import type { PlanSubject, UserSubjectStates } from "@/types/types"

type AddSubjectPanelProps = {
  subjects: ReadonlyArray<PlanSubject>
  states: UserSubjectStates
  commissions: ReadonlyArray<Commission>
  entries: ReadonlyArray<ScheduleEntry>
  onPick: (commission: Commission) => Promise<void>
  onCustom: (subject: PlanSubject) => void
}

type SubjectGroup = { label: string; subjects: PlanSubject[] }

function groupSubjects(subjects: ReadonlyArray<PlanSubject>, states: UserSubjectStates): SubjectGroup[] {
  const taking: PlanSubject[] = []
  const available: PlanSubject[] = []
  const others: PlanSubject[] = []
  for (const subject of subjects) {
    const status = getSubjectStatus(states, subject.id)
    if (status === SubjectStatus.Cursando) taking.push(subject)
    else if (canTakeSubject(subject, states)) available.push(subject)
    else others.push(subject)
  }
  return [
    { label: "Estás cursando", subjects: taking },
    { label: "Podés cursar según tus correlativas", subjects: available },
    { label: "Otras materias del plan", subjects: others },
  ].filter((group) => group.subjects.length > 0)
}

/** Picks a subject, then one of its catalog commissions (or manual slots when it has none). */
export function AddSubjectPanel({ subjects, states, commissions, entries, onPick, onCustom }: AddSubjectPanelProps) {
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [pickingId, setPickingId] = useState<number | null>(null)
  const groups = useMemo(() => groupSubjects(subjects, states), [subjects, states])
  const subject = subjects.find((candidate) => candidate.id === subjectId) ?? null
  const subjectCommissions = commissions.filter((commission) => commission.subjectId === subjectId)
  const currentEntry = entries.find((entry) => entry.subjectId === subjectId) ?? null
  const commissionCountBySubject = useMemo(() => {
    const counts = new Map<number, number>()
    for (const commission of commissions) counts.set(commission.subjectId, (counts.get(commission.subjectId) ?? 0) + 1)
    return counts
  }, [commissions])

  const pick = async (commission: Commission) => {
    setPickingId(commission.id)
    await onPick(commission)
    setPickingId(null)
  }

  return (
    <section className="surface-card space-y-4 p-4 md:p-5" aria-labelledby="add-subject-title">
      <div>
        <h2 id="add-subject-title" className="font-serif text-lg font-semibold text-foreground">
          Agregar materia
        </h2>
        <p className="text-sm text-muted-foreground">Elegí una materia y una de sus comisiones. El horario se arma solo.</p>
      </div>

      <Select value={subjectId === null ? "" : String(subjectId)} onValueChange={(value) => setSubjectId(Number(value))}>
        <SelectTrigger aria-label="Materia" className="bg-background">
          <SelectValue placeholder="Elegí una materia" />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {groups.map((group) => (
            <SelectGroup key={group.label}>
              <SelectLabel className="text-xs uppercase tracking-wide text-muted-foreground">{group.label}</SelectLabel>
              {group.subjects.map((candidate) => (
                <SelectItem key={candidate.id} value={String(candidate.id)}>
                  {candidate.name} · Nivel {candidate.level}
                  {commissionCountBySubject.has(candidate.id) ? "" : " · sin comisiones"}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>

      {subject && subjectCommissions.length === 0 && (
        <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
          <p className="text-sm text-muted-foreground">
            Todavía no hay comisiones cargadas para <span className="font-medium text-foreground">{subject.name}</span>. Podés
            cargar tus días y horarios a mano.
          </p>
          <Button variant="outline" onClick={() => onCustom(subject)}>
            <PenLine className="h-4 w-4" />
            {currentEntry?.kind === ScheduleEntryKind.Custom ? "Editar horario manual" : "Cargar horario manual"}
          </Button>
        </div>
      )}

      {subject && subjectCommissions.length > 0 && (
        <ul className="space-y-2">
          {subjectCommissions.map((commission) => {
            const isCurrent = currentEntry?.commissionId === commission.id
            const clashes = commissionClashes(commission.slots, commission.subjectId, entries)
            return (
              <li key={commission.id} className="space-y-2 rounded-lg border border-border bg-background p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">{commission.name}</span>
                    <Badge variant={BadgeVariant.Outline} className="font-normal">
                      {COMMISSION_SHIFT_LABELS[commission.shift]}
                    </Badge>
                    <Badge variant={BadgeVariant.Outline} className="font-normal">
                      {COMMISSION_PERIOD_LABELS[commission.period]}
                    </Badge>
                  </div>
                  <Button size="sm" variant={isCurrent ? "secondary" : "default"} disabled={isCurrent || pickingId !== null} onClick={() => void pick(commission)}>
                    {pickingId === commission.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCurrent ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {isCurrent ? "En tu horario" : currentEntry ? "Cambiar a esta" : "Elegir"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {commission.slots
                    .map((slot) => `${CLASS_DAY_SHORT_LABELS[slot.day]} ${slot.start}–${slot.end}${slot.classroom ? ` (${slot.classroom})` : ""}`)
                    .join(" · ")}
                </p>
                {clashes.length > 0 && (
                  <p className="flex items-start gap-1.5 text-xs font-medium text-destructive">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Se superpone con {clashes.join(", ")}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
