"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { AlertTriangle, CalendarPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  deleteScheduleEntryAction,
  getMyScheduleAction,
  pickCommissionAction,
  saveCustomEntryAction,
  updateCustomEntryAction,
  type MySchedule,
} from "@/app/actions/schedule"
import { getMySubjectStatesAction } from "@/app/actions/student"
import { PageHeader } from "@/components/brand/page-header"
import { AddSubjectPanel } from "@/components/schedule/add-subject-panel"
import { CustomEntryDialog, type CustomEntryValues } from "@/components/schedule/custom-entry-dialog"
import { EntryList } from "@/components/schedule/entry-list"
import { ExportButtons } from "@/components/schedule/export-buttons"
import { ScheduleGrid } from "@/components/schedule/schedule-grid"
import { ShareDialog } from "@/components/schedule/share-dialog"
import type { ActionResult } from "@/lib/action-result"
import { findOverlaps } from "@/lib/schedule/overlaps"
import type { Commission, ScheduleEntry } from "@/lib/schedule/types"
import { ScheduleEntryKind } from "@/types/enums"
import type { PlanSubject, UserSubjectStates } from "@/types/types"
import { usePlanSubjects } from "../_hooks/usePlanSubjects"

type CustomDialogState = { subject: Pick<PlanSubject, "id" | "name">; entry: ScheduleEntry | null } | null

export default function HorariosPage() {
  const { data: session } = useSession()
  const [schedule, setSchedule] = useState<MySchedule | null>(null)
  const [states, setStates] = useState<UserSubjectStates>({})
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [highlightedEntryId, setHighlightedEntryId] = useState<number | null>(null)
  const [customDialog, setCustomDialog] = useState<CustomDialogState>(null)
  const [pickerSubjectId, setPickerSubjectId] = useState<number | null>(null)
  const careerId = schedule?.careerId ?? null
  const { subjects } = usePlanSubjects(careerId)

  const reload = useCallback(async () => {
    const result = await getMyScheduleAction()
    if (!result.ok) {
      setLoadError(result.error)
      return
    }
    setLoadError(null)
    setSchedule(result.data)
  }, [])

  useEffect(() => {
    const load = async () => {
      await reload()
      setIsLoading(false)
    }
    void load()
  }, [reload])

  useEffect(() => {
    if (careerId === null) return
    const loadStates = async () => {
      const result = await getMySubjectStatesAction(careerId)
      if (result.ok) setStates(result.data)
    }
    void loadStates()
  }, [careerId])

  const entries = useMemo(() => schedule?.entries ?? [], [schedule])
  const overlaps = useMemo(() => findOverlaps(entries), [entries])
  const overlappingEntryIds = useMemo(() => {
    const ids = new Set<number>()
    for (const overlap of overlaps) {
      ids.add(overlap.firstEntryId)
      ids.add(overlap.secondEntryId)
    }
    return ids
  }, [overlaps])

  const handlePick = async (commission: Commission) => {
    const result = await pickCommissionAction(commission.id)
    if (!result.ok) {
      toast.error("No se pudo agregar la comisión", { description: result.error })
      return
    }
    await reload()
    const subjectName = subjects.find((subject) => subject.id === commission.subjectId)?.name ?? "La materia"
    toast.success(`${subjectName}: comisión ${commission.name} agregada`)
  }

  const openCustom = (subject: Pick<PlanSubject, "id" | "name">) => {
    const entry = entries.find((candidate) => candidate.subjectId === subject.id) ?? null
    setCustomDialog({ subject, entry })
  }

  const handleCustomSubmit = async (values: CustomEntryValues): Promise<ActionResult<null>> => {
    if (!customDialog) return { ok: false, error: "No hay materia seleccionada" }
    const { subject, entry } = customDialog
    const result =
      entry && entry.kind === ScheduleEntryKind.Custom
        ? await updateCustomEntryAction({ id: entry.id, ...values })
        : await saveCustomEntryAction({ subjectId: subject.id, ...values })
    if (result.ok) {
      setCustomDialog(null)
      await reload()
      toast.success(`${subject.name}: horario guardado`)
    }
    return result
  }

  const handleDelete = async (entry: ScheduleEntry) => {
    const result = await deleteScheduleEntryAction(entry.id)
    if (!result.ok) {
      toast.error("No se pudo quitar la materia", { description: result.error })
      return
    }
    await reload()
    toast.success(`${entry.subjectName} quitada del horario`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground" role="status">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando tu horario...
      </div>
    )
  }

  if (loadError) {
    return <div className="surface-card border-destructive/40 p-6 text-destructive">No se pudo cargar tu horario: {loadError}</div>
  }

  if (!schedule) {
    return (
      <div className="surface-card p-6 text-muted-foreground">
        Elegí tu carrera para empezar a armar tu horario (se abre el selector al entrar al panel o desde tu perfil).
      </div>
    )
  }

  const studentName = session?.user?.name ?? null

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <PageHeader
        eyebrow="Planificación del cuatrimestre"
        title="Gestor de Horarios"
        description="Elegí las comisiones de tus materias, revisá superposiciones y exportá o compartí tu horario."
        actions={
          <>
            <ExportButtons entries={entries} meta={{ studentName, careerName: schedule.careerName }} />
            <ShareDialog disabled={entries.length === 0} defaultDisplayName={studentName ?? ""} />
          </>
        }
      />

      {overlaps.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive" role="status">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Tu horario tiene {overlaps.length} {overlaps.length === 1 ? "superposición" : "superposiciones"}. Elegí otra comisión
            para alguna de las materias marcadas en rojo.
          </p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <ScheduleGrid entries={entries} highlightedEntryId={highlightedEntryId} />
          {entries.length === 0 && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              Tu horario está vacío. Agregá una materia desde el panel.
            </p>
          )}
        </div>

        <div className="space-y-6">
          <AddSubjectPanel
            subjects={subjects}
            states={states}
            commissions={schedule.commissions}
            entries={entries}
            onPick={handlePick}
            onCustom={openCustom}
            subjectId={pickerSubjectId}
            onSubjectChange={setPickerSubjectId}
          />
          {entries.length > 0 && (
            <section className="surface-card space-y-3 p-4 md:p-5" aria-labelledby="my-subjects-title">
              <h2 id="my-subjects-title" className="font-serif text-lg font-semibold text-foreground">
                Tus materias ({entries.length})
              </h2>
              <EntryList
                entries={entries}
                overlappingEntryIds={overlappingEntryIds}
                onHighlight={setHighlightedEntryId}
                onEdit={(entry) => openCustom({ id: entry.subjectId, name: entry.subjectName })}
                onChangeCommission={(entry) => {
                  setPickerSubjectId(entry.subjectId)
                  document.getElementById("add-subject-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })
                }}
                onDelete={(entry) => void handleDelete(entry)}
              />
            </section>
          )}
        </div>
      </div>

      {customDialog && (
        <CustomEntryDialog
          subjectName={customDialog.subject.name}
          initial={customDialog.entry && customDialog.entry.kind === ScheduleEntryKind.Custom ? { label: customDialog.entry.label, slots: customDialog.entry.slots } : null}
          onClose={() => setCustomDialog(null)}
          onSubmit={handleCustomSubmit}
        />
      )}
    </motion.div>
  )
}
