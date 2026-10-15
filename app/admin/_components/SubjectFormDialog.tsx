"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { createSubjectAction, updateSubjectAction } from "@/app/actions/admin"
import type { AdminSubject } from "@/db/queries/admin"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isEnumValue } from "@/lib/admin/labels"
import { SUBJECT_LEVELS } from "@/lib/subject-levels"
import { subjectFieldsSchema } from "@/lib/validation/admin"
import { idSchema } from "@/lib/validation/student"
import { ExamTable } from "@/types/enums"
import type { Career } from "@/types/types"

const NO_EXAM_TABLE = "none"

const subjectFormSchema = subjectFieldsSchema.extend({
  careerId: z.number({ invalid_type_error: "Elegí una carrera" }).pipe(idSchema),
})

type SubjectFormValues = z.infer<typeof subjectFormSchema>

type SubjectFormDialogProps = {
  careers: ReadonlyArray<Career>
  defaultCareerId: number | null
  subject: AdminSubject | null
  onClose: () => void
  onSaved: () => Promise<void>
}

function toDefaultValues(subject: AdminSubject | null, defaultCareerId: number | null): SubjectFormValues {
  if (subject) {
    return {
      careerId: subject.careerId,
      number: subject.number,
      name: subject.name,
      level: subject.level,
      hours: subject.hours,
      isElective: subject.isElective,
      isBasicScience: subject.isBasicScience,
      examTable: subject.examTable,
    }
  }
  return {
    careerId: defaultCareerId ?? Number.NaN,
    number: Number.NaN,
    name: "",
    level: SUBJECT_LEVELS[0],
    hours: null,
    isElective: false,
    isBasicScience: false,
    examTable: null,
  }
}

function numberInputValue(value: number | null): string {
  return value === null || Number.isNaN(value) ? "" : String(value)
}

export function SubjectFormDialog({ careers, defaultCareerId, subject, onClose, onSaved }: SubjectFormDialogProps) {
  const isEditing = subject !== null
  const [submitError, setSubmitError] = useState<string | null>(null)
  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: toDefaultValues(subject, defaultCareerId),
  })

  const onSubmit = async (values: SubjectFormValues) => {
    setSubmitError(null)
    const { careerId, ...fields } = values
    const result = subject ? await updateSubjectAction({ id: subject.id, ...fields }) : await createSubjectAction({ careerId, ...fields })
    if (!result.ok) {
      setSubmitError(result.error)
      return
    }
    await onSaved()
  }

  const inputClassName = "bg-background"

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar materia" : "Nueva materia"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing ? "Modificá los datos de la materia." : "Completá los datos de la materia que querés agregar al plan."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="careerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carrera</FormLabel>
                  <Select
                    value={Number.isNaN(field.value) ? undefined : String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger className={inputClassName}>
                        <SelectValue placeholder="Elegí una carrera" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {careers.map((career) => (
                        <SelectItem key={career.id} value={String(career.id)}>
                          {career.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        className={inputClassName}
                        value={numberInputValue(field.value)}
                        onChange={(event) => field.onChange(event.target.valueAsNumber)}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel</FormLabel>
                    <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
                      <FormControl>
                        <SelectTrigger className={inputClassName}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SUBJECT_LEVELS.map((value) => (
                          <SelectItem key={value} value={String(value)}>
                            {value}
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
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        className={inputClassName}
                        value={numberInputValue(field.value)}
                        onChange={(event) => field.onChange(event.target.value === "" ? null : event.target.valueAsNumber)}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input className={inputClassName} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="examTable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mesa de examen</FormLabel>
                  <Select
                    value={field.value ?? NO_EXAM_TABLE}
                    onValueChange={(value) => field.onChange(isEnumValue(ExamTable, value) ? value : null)}
                  >
                    <FormControl>
                      <SelectTrigger className={inputClassName}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_EXAM_TABLE}>Sin mesa asignada</SelectItem>
                      {Object.values(ExamTable).map((examTable) => (
                        <SelectItem key={examTable} value={examTable}>
                          {examTable}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-wrap gap-6">
              <FormField
                control={form.control}
                name="isElective"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                    </FormControl>
                    <FormLabel>Electiva</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isBasicScience"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                    </FormControl>
                    <FormLabel>Ciencias básicas</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? "Guardar cambios" : "Crear materia"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
