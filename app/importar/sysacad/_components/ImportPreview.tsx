"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { getCareersAction, getPlanSubjectsAction } from "@/app/actions/catalog"
import { getMyCareerIdAction, getMySubjectStatesAction, selectMyCareerAction } from "@/app/actions/student"
import { importSysacadStatesAction } from "@/app/actions/sysacad"
import { BrandLoader } from "@/components/brand/brand-loader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { isEnumValue } from "@/lib/admin/labels"
import { describeSysacadRow, RELIABLE_MATCH_METHODS } from "@/lib/sysacad/labels"
import { isImportableRow, matchSysacadRows, OTHER_PLAN_METHODS, type SysacadRowMatch } from "@/lib/sysacad/match"
import {
  countWrites,
  planSysacadImport,
  summarizeSysacadChanges,
  SysacadChangeKind,
  SysacadImportMode,
  sysacadRowToState,
  type SysacadChange,
  type SysacadImportItem,
  type SysacadImportSummary,
} from "@/lib/sysacad/plan"
import { checkSysacadPlan, SysacadPlanCheckKind } from "@/lib/sysacad/plan-check"
import type { SysacadRow } from "@/lib/sysacad/types"
import { useCareerStore } from "@/stores/useCareerStore"
import { useUserSubjectsStore } from "@/stores/useUserSubjectsStore"
import { BadgeVariant } from "@/types/enums"
import type { Career, PlanSubject, UserSubjectStates } from "@/types/types"
import { ImportRow } from "./ImportRow"

const SUBJECTS_PAGE = "/dashboard/materias"

type LoadedData = { career: Career; careers: Career[]; subjects: PlanSubject[]; states: UserSubjectStates }

enum LoadPhase {
  Loading = "loading",
  NoCareer = "no_career",
  Failed = "failed",
  Ready = "ready",
}

type Choices = Record<number, number | null>

function summaryDescription(summary: SysacadImportSummary): string {
  const parts: string[] = []
  const add = (count: number, singular: string, plural: string) => {
    if (count > 0) parts.push(`${count} ${count === 1 ? singular : plural}`)
  }
  add(summary[SysacadChangeKind.New], "nueva", "nuevas")
  add(summary[SysacadChangeKind.Upgrade], "avanzó de estado", "avanzaron de estado")
  add(summary[SysacadChangeKind.GradeFill] + summary[SysacadChangeKind.GradeChange], "con nota", "con nota")
  add(summary[SysacadChangeKind.Downgrade], "bajó de estado", "bajaron de estado")
  add(summary[SysacadChangeKind.Kept], "mantuvo tu estado", "mantuvieron tu estado")
  return parts.length > 0 ? `${parts.join(", ")}.` : "No hubo cambios."
}

type ImportPreviewProps = {
  rows: SysacadRow[]
  onDiscard: () => void
  onImported: () => void
}

/** Shows what importing changes, lets the student fix the matching, and saves on confirmation. */
export function ImportPreview({ rows, onDiscard, onImported }: ImportPreviewProps) {
  const router = useRouter()
  const storeCareerId = useCareerStore((state) => state.selectedCareer?.id ?? null)
  const selectCareerById = useCareerStore((state) => state.selectCareerById)
  const loadedCareerId = useRef<number | null>(null)
  const fetchUserSubjects = useUserSubjectsStore((state) => state.fetchUserSubjects)

  const [phase, setPhase] = useState<LoadPhase>(LoadPhase.Loading)
  const [data, setData] = useState<LoadedData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [choices, setChoices] = useState<Choices>({})
  const [mode, setMode] = useState<SysacadImportMode>(SysacadImportMode.Merge)
  const [isSaving, setIsSaving] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  const load = useCallback(async () => {
    setPhase(LoadPhase.Loading)
    const [careerResult, careersResult] = await Promise.all([getMyCareerIdAction(), getCareersAction()])
    if (!careerResult.ok || !careersResult.ok) {
      setLoadError(careerResult.ok ? (careersResult.ok ? null : careersResult.error) : careerResult.error)
      setPhase(LoadPhase.Failed)
      return
    }
    const career = careersResult.data.find((item) => item.id === careerResult.data)
    // Share the student's real career with the rest of the dashboard (Materias reads it from the store), so the
    // first-visit dialog and the plan switch below can select by id and reload this page.
    useCareerStore.setState({ careers: careersResult.data, selectedCareer: career ?? null, isLoading: false, error: null })
    loadedCareerId.current = career?.id ?? null
    if (!career) {
      setPhase(LoadPhase.NoCareer)
      return
    }
    const [subjectsResult, statesResult] = await Promise.all([getPlanSubjectsAction(career.id), getMySubjectStatesAction(career.id)])
    if (!subjectsResult.ok || !statesResult.ok) {
      setLoadError(subjectsResult.ok ? (statesResult.ok ? null : statesResult.error) : subjectsResult.error)
      setPhase(LoadPhase.Failed)
      return
    }
    setData({ career, careers: careersResult.data, subjects: subjectsResult.data, states: statesResult.data })
    setChoices({})
    setPhase(LoadPhase.Ready)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Reloads when the career changes elsewhere (the first-visit dialog), not when `load` itself stored it.
  useEffect(() => {
    if (storeCareerId !== null && storeCareerId !== loadedCareerId.current) void load()
  }, [load, storeCareerId])

  const matches = useMemo<SysacadRowMatch[]>(() => {
    if (!data) return []
    return matchSysacadRows(
      rows,
      data.subjects.map((subject) => ({ id: subject.id, name: subject.name, level: subject.level })),
      data.career.plan,
    )
  }, [rows, data])

  const chosenId = useCallback((match: SysacadRowMatch) => (match.index in choices ? choices[match.index] : match.subjectId), [choices])

  const items = useMemo<SysacadImportItem[]>(() => {
    const list: SysacadImportItem[] = []
    for (const match of matches) {
      const state = sysacadRowToState(match.row)
      const subjectId = chosenId(match)
      if (state && subjectId !== null) list.push({ subjectId, ...state })
    }
    return list
  }, [matches, chosenId])

  const changes = useMemo<Map<number, SysacadChange>>(() => {
    if (!data) return new Map()
    return new Map(planSysacadImport(items, data.states, mode).map((change) => [change.subjectId, change]))
  }, [items, data, mode])

  const summary = useMemo(() => summarizeSysacadChanges([...changes.values()]), [changes])
  const writes = countWrites(summary)

  if (phase === LoadPhase.Loading) return <BrandLoader label="Comparando con tus materias..." />
  if (phase === LoadPhase.NoCareer) {
    return (
      <p className="surface-card p-4 text-sm text-muted-foreground md:p-6">
        Primero elegí tu carrera en el diálogo de selección. Después vas a ver acá cómo quedan tus materias.
      </p>
    )
  }
  if (phase === LoadPhase.Failed || !data) {
    return (
      <div role="alert" className="surface-card space-y-3 p-4 md:p-6">
        <p className="text-sm text-destructive">No pudimos cargar tus materias. {loadError}</p>
        <Button variant="outline" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </Button>
      </div>
    )
  }

  const planCheck = checkSysacadPlan(rows, data.career, data.careers)
  const importable = matches.filter((match) => isImportableRow(match.row))
  const needsReview = importable.filter((match) => !RELIABLE_MATCH_METHODS.has(match.method))
  const ready = importable.filter((match) => RELIABLE_MATCH_METHODS.has(match.method))
  const withoutState = matches.filter((match) => !isImportableRow(match.row))
  const otherPlanCount = importable.filter((match) => OTHER_PLAN_METHODS.has(match.method)).length
  const usage = new Map<number, number>()
  for (const match of importable) {
    const id = chosenId(match)
    if (id !== null) usage.set(id, (usage.get(id) ?? 0) + 1)
  }

  const switchCareer = async (career: Career) => {
    setIsSwitching(true)
    const result = await selectMyCareerAction(career.id)
    setIsSwitching(false)
    if (!result.ok) {
      toast.error("No pudimos cambiar tu carrera", { description: result.error })
      return
    }
    // The store change reloads the preview against the new plan.
    selectCareerById(career.id)
    toast.success(`Ahora estás en ${career.name} (Plan ${career.plan})`)
  }

  const runImport = async () => {
    setIsSaving(true)
    const result = await importSysacadStatesAction({ careerId: data.career.id, mode, items })
    setIsSaving(false)
    if (!result.ok) {
      toast.error("No se pudo importar desde SysAcad", { description: result.error })
      return
    }
    const saved = countWrites(result.data)
    toast.success(saved === 1 ? "Importamos 1 materia desde SysAcad" : `Importamos ${saved} materias desde SysAcad`, {
      description: summaryDescription(result.data),
    })
    onImported()
    await fetchUserSubjects(data.career.id)
    router.push(SUBJECTS_PAGE)
  }

  const renderRow = (match: SysacadRowMatch) => {
    const subjectId = chosenId(match)
    return (
      <ImportRow
        key={match.index}
        match={match}
        subjects={data.subjects}
        subjectId={subjectId}
        change={subjectId !== null ? changes.get(subjectId) ?? null : null}
        isShared={subjectId !== null && (usage.get(subjectId) ?? 0) > 1}
        onChoose={(value) => setChoices((previous) => ({ ...previous, [match.index]: value }))}
      />
    )
  }

  return (
    <div className="space-y-6">
      {planCheck.kind !== SysacadPlanCheckKind.SamePlan && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div className="space-y-2">
            <p>
              En SysAcad figurás en el <strong>Plan {planCheck.sysacadPlan}</strong>, pero en AdHorarium elegiste{" "}
              {data.career.name} (Plan {data.career.plan}).
              {planCheck.kind === SysacadPlanCheckKind.PlanMissing &&
                ` AdHorarium todavía no tiene el Plan ${planCheck.sysacadPlan} de tu carrera: solo asociamos las materias con el mismo nombre y el resto queda para que las elijas o las dejes sin importar.`}
            </p>
            {planCheck.kind === SysacadPlanCheckKind.SwitchAvailable && (
              <Button size="sm" variant="outline" disabled={isSwitching} onClick={() => void switchCareer(planCheck.career)}>
                {isSwitching && <Loader2 className="h-4 w-4 animate-spin" />}
                Cambiar a {planCheck.career.name} (Plan {planCheck.career.plan})
              </Button>
            )}
          </div>
        </div>
      )}

      <section className="surface-card space-y-4 p-4 md:p-6" aria-labelledby="sysacad-summary-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="sysacad-summary-title" className="font-serif text-xl font-semibold text-foreground">
            {rows.length} {rows.length === 1 ? "materia leída" : "materias leídas"} de SysAcad
          </h2>
          <p className="text-sm text-muted-foreground">
            {data.career.name} · Plan {data.career.plan}
          </p>
        </div>
        <ul className="flex flex-wrap gap-2 text-xs" aria-label="Resumen de cambios">
          <li><Badge variant={BadgeVariant.Promocionado}>{summary[SysacadChangeKind.New]} nuevas</Badge></li>
          <li><Badge variant={BadgeVariant.Aprobado}>{summary[SysacadChangeKind.Upgrade]} avanzan</Badge></li>
          <li><Badge variant={BadgeVariant.Regular}>{summary[SysacadChangeKind.GradeFill] + summary[SysacadChangeKind.GradeChange]} con nota nueva</Badge></li>
          {summary[SysacadChangeKind.Downgrade] > 0 && <li><Badge variant={BadgeVariant.Destructive}>{summary[SysacadChangeKind.Downgrade]} bajan</Badge></li>}
          <li><Badge variant={BadgeVariant.NoCursando}>{summary[SysacadChangeKind.Unchanged] + summary[SysacadChangeKind.Kept]} sin cambios</Badge></li>
        </ul>
        {otherPlanCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {otherPlanCount === 1 ? "1 materia es" : `${otherPlanCount} materias son`} de otro plan (por ejemplo, el curso de ingreso). Revisalas
            abajo: podés asociarlas a una materia de tu plan o dejarlas sin importar.
          </p>
        )}
        <RadioGroup
          value={mode}
          onValueChange={(value) => {
            if (isEnumValue(SysacadImportMode, value)) setMode(value)
          }}
          className="grid gap-2 md:grid-cols-2"
          aria-label="Cómo importar"
        >
          <Label htmlFor="sysacad-merge" className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 font-normal">
            <RadioGroupItem id="sysacad-merge" value={SysacadImportMode.Merge} className="mt-0.5" />
            <span>
              <span className="block font-medium text-foreground">Combinar</span>
              <span className="text-sm text-muted-foreground">Completa y hace avanzar tus estados. Nunca baja uno que ya cargaste.</span>
            </span>
          </Label>
          <Label htmlFor="sysacad-replace" className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 font-normal">
            <RadioGroupItem id="sysacad-replace" value={SysacadImportMode.Replace} className="mt-0.5" />
            <span>
              <span className="block font-medium text-foreground">Reemplazar</span>
              <span className="text-sm text-muted-foreground">SysAcad manda: las materias importadas toman su estado y su nota, aunque bajen.</span>
            </span>
          </Label>
        </RadioGroup>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => void runImport()} disabled={isSaving || writes === 0} variant={mode === SysacadImportMode.Replace ? "destructive" : "default"}>
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {writes === 0 ? "No hay cambios para importar" : `${mode === SysacadImportMode.Replace ? "Reemplazar" : "Importar"} ${writes} ${writes === 1 ? "materia" : "materias"}`}
          </Button>
          <Button variant="ghost" onClick={onDiscard} disabled={isSaving}>
            Descartar
          </Button>
          <Button variant="link" asChild>
            <Link href={SUBJECTS_PAGE}>Ir a mis materias</Link>
          </Button>
        </div>
      </section>

      {needsReview.length > 0 && (
        <section className="surface-card space-y-3 p-4 md:p-6" aria-labelledby="sysacad-review-title">
          <h2 id="sysacad-review-title" className="font-serif text-lg font-semibold text-foreground">
            Para revisar ({needsReview.length})
          </h2>
          <ul className="divide-y divide-border">{needsReview.map(renderRow)}</ul>
        </section>
      )}

      <section className="surface-card space-y-3 p-4 md:p-6" aria-labelledby="sysacad-ready-title">
        <h2 id="sysacad-ready-title" className="font-serif text-lg font-semibold text-foreground">
          Asociadas a tu plan ({ready.length})
        </h2>
        <ul className="divide-y divide-border">{ready.map(renderRow)}</ul>
      </section>

      {withoutState.length > 0 && (
        <details className="surface-card p-4 md:p-6">
          <summary className="cursor-pointer font-serif text-lg font-semibold text-foreground">
            Sin estado en SysAcad, no se importan ({withoutState.length})
          </summary>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {withoutState.map((match) => (
              <li key={match.index}>
                {match.row.name} · Año {match.row.year} · {describeSysacadRow(match.row)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

