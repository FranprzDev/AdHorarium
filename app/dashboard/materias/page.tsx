"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUserSubjectsStore } from "@/stores/useUserSubjectsStore"
import { useCareerStore } from "@/stores/useCareerStore"
import { PageHeader } from "@/components/brand/page-header"
import { NotebookPen, Loader2, AlertCircle, X } from "lucide-react"
import { toast } from "sonner"
import DeniedAccess from "./_components/DeniedAccess"
import LoadingSubjects from "./_components/LoadingSubjects"
import type { PlanSubject } from "@/types/types"
import { usePlanSubjects } from "../_hooks/usePlanSubjects"
import { getMyCareerIdAction } from "@/app/actions/student"
import { isValidArgentineGrade } from "@/lib/gpa"
import { SUBJECT_STATUS_COLORS, SUBJECT_STATUS_LABELS, isSubjectStatus } from "@/lib/subject-status"
import { BASIC_SCIENCES_CAREER_NAME } from "@/lib/careers"
import { SubjectFilter, SubjectStatus } from "@/types/enums"

export default function MateriasPage() {
  const { selectedCareer, fetchCareers, careers } = useCareerStore()
  const careerId = selectedCareer?.id ?? null
  const {
    userSubjects,
    isLoading: userSubjectsLoading,
    updateUserSubjectState,
    fetchUserSubjects,
  } = useUserSubjectsStore()

  const { subjects: allSubjects, isLoading: subjectsLoading, error } = usePlanSubjects(careerId)

  const [selectedSubject, setSelectedSubject] = useState<PlanSubject | null>(null)
  const [gradeInput, setGradeInput] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [updating, setUpdating] = useState<number | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [gradeError, setGradeError] = useState<string | null>(null)
  const [filter, setFilter] = useState<SubjectFilter>(SubjectFilter.All)

  useEffect(() => {
    if (careers.length > 0) return
    const load = async () => {
      const myCareer = await getMyCareerIdAction()
      await fetchCareers(myCareer.ok ? myCareer.data : null)
    }
    void load()
  }, [careers.length, fetchCareers])

  useEffect(() => {
    if (careerId !== null) void fetchUserSubjects(careerId)
  }, [careerId, fetchUserSubjects])

  const subjectsWithStatus = allSubjects.map(subject => ({
    ...subject,
    status: userSubjects[subject.id]?.status ?? SubjectStatus.NoCursada,
    grade: userSubjects[subject.id]?.grade ?? null,
  }))

  const cienciasBasicasSubjects = subjectsWithStatus.filter(s => s.isBasicScience);
  const careerSubjects = subjectsWithStatus.filter(s => !s.isBasicScience);
  const careerGroupName = selectedCareer?.name || 'Materias de Carrera';

  const renderSubjectGroup = (title: string, subjects: typeof subjectsWithStatus) => {
    if (subjects.length === 0) return null;

    return (
      <motion.div
        key={title}
        variants={itemVariants}
        className="surface-card p-4 md:p-6"
      >
        <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-4">
          <h2 className="font-serif text-xl font-semibold text-foreground">{title}</h2>
          <span className="text-sm text-muted-foreground">
            ({subjects.length} materias)
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {subjects.map(subject => (
            <Card
              key={subject.id}
              className="bg-background shadow-none transition-colors hover:border-primary/40"
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-medium leading-snug text-foreground">
                      {subject.name}
                    </h3>
                    {subject.status === SubjectStatus.Promocionada && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openGradeModal(subject)}
                        className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                        aria-label={`Cargar nota de ${subject.name}`}
                        disabled={updating === subject.id}
                      >
                        <NotebookPen className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Select
                      value={subject.status}
                      onValueChange={value => {
                        if (isSubjectStatus(value)) {
                          handleStatusChange(subject.id, value)
                        }
                      }}
                      disabled={updating === subject.id}
                    >
                      <SelectTrigger className="h-8 bg-card text-xs" aria-label={`Estado de ${subject.name}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(SubjectStatus).map(status => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${SUBJECT_STATUS_COLORS[status]}`}
                              />
                              {SUBJECT_STATUS_LABELS[status]}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {subject.status === SubjectStatus.Promocionada && subject.grade && (
                      <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        Nota: {subject.grade}/10
                      </div>
                    )}
                    {updating === subject.id && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Actualizando...
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    )
  }

  const handleStatusChange = async (subjectId: number, status: SubjectStatus) => {
    const subjectName = allSubjects.find((subject) => subject.id === subjectId)?.name ?? "la materia"
    setUpdating(subjectId)
    setUpdateError(null)
    const grade = status === SubjectStatus.Promocionada ? userSubjects[subjectId]?.grade ?? null : null
    const result = await updateUserSubjectState(subjectId, status, grade)
    setUpdating(null)
    if (result.ok) {
      toast.success(`${subjectName}: ${SUBJECT_STATUS_LABELS[status]}`)
      return
    }
    toast.error(`No se pudo actualizar ${subjectName}. Volvimos al estado anterior.`, { description: result.error })
  }

  const handleGradeSubmit = async () => {
    if (!selectedSubject) return

    const grade = parseFloat(gradeInput)
    if (!isValidArgentineGrade(grade)) {
      setUpdateError("La nota debe ser un número entre 1 y 10")
      return
    }

    setUpdating(selectedSubject.id)
    setUpdateError(null)
    const result = await updateUserSubjectState(selectedSubject.id, SubjectStatus.Promocionada, grade)
    setUpdating(null)
    if (!result.ok) {
      setGradeError("No se pudo guardar la nota. Probá de nuevo.")
      toast.error(`No se pudo guardar la nota de ${selectedSubject.name}.`, { description: result.error })
      return
    }
    toast.success(`Nota de ${selectedSubject.name} guardada: ${grade}/10`)
    setIsModalOpen(false)
    setGradeInput("")
    setSelectedSubject(null)
  }

  const openGradeModal = (subject: PlanSubject) => {
    setSelectedSubject(subject)
    setGradeInput(userSubjects[subject.id]?.grade?.toString() ?? "")
    setGradeError(null)
    setIsModalOpen(true)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  }

  if (subjectsLoading || userSubjectsLoading) {
    return <LoadingSubjects />
  }

  if (error) {
    return <DeniedAccess />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
        <PageHeader
          eyebrow="Seguimiento académico"
          title="Gestor de Materias"
          description="Gestiona el estado de tus materias y lleva un registro de tu progreso académico."
        />

        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-1 text-sm font-medium text-muted-foreground">Filtrar por:</p>
          <Button
            size="sm"
            onClick={() => setFilter(SubjectFilter.All)}
            variant={filter === SubjectFilter.All ? "default" : "outline"}
            className={filter === SubjectFilter.All ? "" : "bg-card"}
          >
            Todas
          </Button>
          <Button
            size="sm"
            onClick={() => setFilter(SubjectFilter.Basic)}
            variant={filter === SubjectFilter.Basic ? "default" : "outline"}
            className={filter === SubjectFilter.Basic ? "" : "bg-card"}
            disabled={cienciasBasicasSubjects.length === 0}
          >
            Ciencias Básicas
          </Button>
          <Button
            size="sm"
            onClick={() => setFilter(SubjectFilter.Career)}
            variant={filter === SubjectFilter.Career ? "default" : "outline"}
            className={filter === SubjectFilter.Career ? "" : "bg-card"}
            disabled={careerSubjects.length === 0}
          >
            {careerGroupName}
          </Button>
        </div>

        {updateError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-sm text-destructive">{updateError}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUpdateError(null)}
              className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label="Cerrar mensaje de error"
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          { (filter === SubjectFilter.All || filter === SubjectFilter.Basic) && renderSubjectGroup(BASIC_SCIENCES_CAREER_NAME, cienciasBasicasSubjects) }
          { (filter === SubjectFilter.All || filter === SubjectFilter.Career) && renderSubjectGroup(careerGroupName, careerSubjects) }
        </motion.div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Ingresar nota para {selectedSubject?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Label htmlFor="grade">Nota final (1-10)</Label>
              <Input
                id="grade"
                type="number"
                value={gradeInput}
                onChange={e => {
                  setGradeInput(e.target.value)
                  setGradeError(null)
                }}
                min="1"
                max="10"
                aria-invalid={gradeError !== null}
                aria-describedby={gradeError ? "grade-error" : undefined}
              />
              {gradeError && (
                <p id="grade-error" role="alert" className="text-sm text-destructive">
                  {gradeError}
                </p>
              )}
              <Button onClick={handleGradeSubmit} disabled={updating !== null}>
                {updating ? "Guardando..." : "Guardar Nota"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
    </motion.div>
  )
}
