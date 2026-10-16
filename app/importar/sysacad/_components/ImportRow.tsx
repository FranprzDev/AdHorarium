"use client"

import { ArrowRight } from "lucide-react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { describeSysacadRow, SYSACAD_CHANGE_LABELS, SYSACAD_MATCH_HINTS } from "@/lib/sysacad/labels"
import type { SysacadRowMatch } from "@/lib/sysacad/match"
import { SysacadChangeKind, WRITING_CHANGE_KINDS, type SysacadChange } from "@/lib/sysacad/plan"
import { SUBJECT_STATUS_LABELS } from "@/lib/subject-status"
import { cn } from "@/lib/utils"
import type { PlanSubject, UserSubjectState } from "@/types/types"

/** Select value meaning "do not import this row". */
export const SKIP_VALUE = "skip"

function describeState(state: UserSubjectState | null): string {
  if (!state) return "Sin estado"
  const label = SUBJECT_STATUS_LABELS[state.status]
  return state.grade !== null ? `${label} (${state.grade})` : label
}

type ImportRowProps = {
  match: SysacadRowMatch
  subjects: PlanSubject[]
  subjectId: number | null
  change: SysacadChange | null
  /** Another SysAcad row is mapped to the same subject; the most advanced state wins. */
  isShared: boolean
  onChoose: (subjectId: number | null) => void
}

/** One SysAcad row: its state, the plan subject it goes to (editable) and what changes. */
export function ImportRow({ match, subjects, subjectId, change, isShared, onChoose }: ImportRowProps) {
  const { row } = match
  const hint = SYSACAD_MATCH_HINTS[match.method]
  const suggested = match.candidateIds
    .map((id) => subjects.find((subject) => subject.id === id))
    .filter((subject): subject is PlanSubject => subject !== undefined)
  const suggestedIds = new Set(suggested.map((subject) => subject.id))
  const others = subjects.filter((subject) => !suggestedIds.has(subject.id))
  const writes = change !== null && WRITING_CHANGE_KINDS.has(change.kind)

  return (
    <li className="grid gap-3 py-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-foreground">{row.name}</p>
        <p className="text-xs text-muted-foreground">
          {describeSysacadRow(row)} · Año {row.year}
          {row.plan && ` · Plan ${row.plan}`}
        </p>
        {hint && <p className="text-xs text-amber-700 dark:text-amber-300">{hint}</p>}
        {isShared && <p className="text-xs text-amber-700 dark:text-amber-300">Otra fila de SysAcad va a la misma materia: se usa el estado más avanzado.</p>}
      </div>
      <Select
        value={subjectId === null ? SKIP_VALUE : String(subjectId)}
        onValueChange={(value) => onChoose(value === SKIP_VALUE ? null : Number.parseInt(value, 10))}
      >
        <SelectTrigger className="h-9 bg-card text-xs" aria-label={`Materia de AdHorarium para ${row.name}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SKIP_VALUE}>No importar</SelectItem>
          {suggested.length > 0 && (
            <SelectGroup>
              <SelectLabel>Sugeridas</SelectLabel>
              {suggested.map((subject) => (
                <SelectItem key={subject.id} value={String(subject.id)}>
                  {subject.name} · Nivel {subject.level}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          <SelectGroup>
            <SelectLabel>Tu plan</SelectLabel>
            {others.map((subject) => (
              <SelectItem key={subject.id} value={String(subject.id)}>
                {subject.name} · Nivel {subject.level}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <div className="flex flex-wrap items-center gap-2 text-xs" data-change={change?.kind ?? SKIP_VALUE}>
        {change ? (
          <>
            <span className="text-muted-foreground">{describeState(change.current)}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" aria-label="pasa a" />
            <span className="font-medium text-foreground">{describeState(change.next)}</span>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 font-semibold",
                writes ? "border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300" : "border-border bg-muted text-muted-foreground",
                change.kind === SysacadChangeKind.Downgrade && "border-destructive/40 bg-destructive/10 text-destructive",
              )}
            >
              {SYSACAD_CHANGE_LABELS[change.kind]}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">No se importa</span>
        )}
      </div>
    </li>
  )
}
