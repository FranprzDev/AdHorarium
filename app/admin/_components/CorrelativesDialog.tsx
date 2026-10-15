"use client"

import { useCallback, useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { addCorrelativeAction, listAdminSubjectsAction, listSubjectCorrelativesAction, removeCorrelativeAction } from "@/app/actions/admin"
import type { AdminCorrelative, AdminSubject } from "@/db/queries/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CORRELATIVE_PURPOSE_LABELS, CORRELATIVE_TYPE_LABELS, isEnumValue } from "@/lib/admin/labels"
import { correlativeInputSchema } from "@/lib/validation/admin"
import { idSchema } from "@/lib/validation/student"
import { BadgeVariant, CorrelativePurpose, CorrelativeType } from "@/types/enums"

const correlativeFormSchema = correlativeInputSchema.extend({
  requiredSubjectId: z.number({ invalid_type_error: "Elegí una materia" }).pipe(idSchema),
})

type CorrelativeFormValues = z.infer<typeof correlativeFormSchema>

type CorrelativesDialogProps = {
  subject: AdminSubject
  onClose: () => void
}

export function CorrelativesDialog({ subject, onClose }: CorrelativesDialogProps) {
  const [correlatives, setCorrelatives] = useState<AdminCorrelative[]>([])
  const [candidates, setCandidates] = useState<AdminSubject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)

  const form = useForm<CorrelativeFormValues>({
    resolver: zodResolver(correlativeFormSchema),
    defaultValues: {
      subjectId: subject.id,
      requiredSubjectId: Number.NaN,
      purpose: CorrelativePurpose.Cursar,
      requirementType: CorrelativeType.Regulares,
    },
  })
  const purpose = form.watch("purpose")

  const loadCorrelatives = useCallback(async () => {
    const result = await listSubjectCorrelativesAction(subject.id)
    if (result.ok) setCorrelatives(result.data)
    else setError(result.error)
  }, [subject.id])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      const careerSubjects = await listAdminSubjectsAction({ careerId: subject.careerId, level: null, search: "" })
      if (careerSubjects.ok) {
        setCandidates(careerSubjects.data.filter((candidate) => candidate.id !== subject.id && candidate.level <= subject.level))
      } else {
        setError(careerSubjects.error)
      }
      await loadCorrelatives()
      setIsLoading(false)
    }
    void load()
  }, [subject.careerId, subject.id, subject.level, loadCorrelatives])

  useEffect(() => {
    if (purpose === CorrelativePurpose.Rendir) form.setValue("requirementType", CorrelativeType.Aprobadas)
  }, [purpose, form])

  const onSubmit = async (values: CorrelativeFormValues) => {
    setError(null)
    const result = await addCorrelativeAction(values)
    if (!result.ok) {
      setError(result.error)
      return
    }
    form.reset({ ...values, requiredSubjectId: Number.NaN })
    await loadCorrelatives()
  }

  const handleRemove = async (correlativeId: number) => {
    setRemovingId(correlativeId)
    setError(null)
    const result = await removeCorrelativeAction(correlativeId)
    if (result.ok) await loadCorrelatives()
    else setError(result.error)
    setRemovingId(null)
  }

  const triggerClassName = "bg-background"

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Correlativas de {subject.name}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Nivel {subject.level} · {subject.careerName}. Solo se pueden exigir materias de la misma carrera y de un nivel igual o
            inferior.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando correlativas...
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {correlatives.length === 0 && <p className="text-muted-foreground">Esta materia no tiene correlativas.</p>}
            {correlatives.map((correlative) => (
              <div key={correlative.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span>
                    {correlative.requiredNumber}. {correlative.requiredName}
                  </span>
                  <Badge variant={BadgeVariant.Outline} className="text-muted-foreground">
                    {CORRELATIVE_PURPOSE_LABELS[correlative.purpose]}
                  </Badge>
                  <Badge variant={BadgeVariant.Outline} className="text-muted-foreground">
                    {CORRELATIVE_TYPE_LABELS[correlative.requirementType]}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Quitar ${correlative.requiredName}`}
                  disabled={removingId === correlative.id}
                  onClick={() => void handleRemove(correlative.id)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  {removingId === correlative.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-3 border-t border-border pt-4 md:grid-cols-4">
            <FormField
              control={form.control}
              name="requiredSubjectId"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Materia requerida</FormLabel>
                  <Select
                    value={Number.isNaN(field.value) ? "" : String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <FormControl>
                      <SelectTrigger className={triggerClassName}>
                        <SelectValue placeholder="Elegí una materia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {candidates.map((candidate) => (
                        <SelectItem key={candidate.id} value={String(candidate.id)}>
                          {candidate.number}. {candidate.name} (nivel {candidate.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propósito</FormLabel>
                  <Select value={field.value} onValueChange={(value) => isEnumValue(CorrelativePurpose, value) && field.onChange(value)}>
                    <FormControl>
                      <SelectTrigger className={triggerClassName}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(CorrelativePurpose).map((value) => (
                        <SelectItem key={value} value={value}>
                          {CORRELATIVE_PURPOSE_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="requirementType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condición</FormLabel>
                  <Select
                    value={field.value}
                    disabled={purpose === CorrelativePurpose.Rendir}
                    onValueChange={(value) => isEnumValue(CorrelativeType, value) && field.onChange(value)}
                  >
                    <FormControl>
                      <SelectTrigger className={triggerClassName}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(CorrelativeType).map((value) => (
                        <SelectItem key={value} value={value}>
                          {CORRELATIVE_TYPE_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-sm text-destructive md:col-span-4">{error}</p>}
            <div className="md:col-span-4 flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
                {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Agregar correlativa
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
