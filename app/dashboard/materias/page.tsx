"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { NotebookPen, Loader2, AlertCircle, X } from "lucide-react"
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
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Badge className="bg-purple-700 text-white px-3 py-1">
            {title}
          </Badge>
          <span className="text-sm text-purple-200">
            ({subjects.length} materias)
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {subjects.map(subject => (
            <Card
              key={subject.id}
              className="bg-white/5 border-purple-500/20 hover:bg-white/10 transition-colors"
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-white font-medium text-sm leading-tight">
                      {subject.name}
                    </h3>
                    {subject.status === SubjectStatus.Promocionada && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openGradeModal(subject)}
                        className="h-8 w-8 p-0 text-purple-300 hover:text-white hover:bg-purple-700/30"
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
                      <SelectTrigger className="h-8 text-xs bg-transparent border-purple-500/30 text-white">
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
                      <div className="text-xs text-green-300 font-medium">
                        Nota: {subject.grade}/10
                      </div>
                    )}
                    {updating === subject.id && (
                      <div className="flex items-center gap-1 text-xs text-purple-300">
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

  const handleStatusChange = async (
    subjectId: number,
    status: SubjectStatus
  ) => {
    if (careerId === null) return
    setUpdating(subjectId)
    setUpdateError(null)
    const saved = await updateUserSubjectState(
      careerId,
      subjectId,
      status,
      status === SubjectStatus.Promocionada
        ? userSubjects[subjectId]?.grade ?? null
        : null
    )
    if (!saved) setUpdateError("Error al actualizar la materia")
    setUpdating(null)
  }

  const handleGradeSubmit = async () => {
    if (!selectedSubject || careerId === null) return

    const grade = parseFloat(gradeInput)
    if (!isValidArgentineGrade(grade)) {
      setUpdateError("La nota debe ser un número entre 1 y 10")
      return
    }

    setUpdating(selectedSubject.id)
    setUpdateError(null)
    const saved = await updateUserSubjectState(
      careerId,
      selectedSubject.id,
      SubjectStatus.Promocionada,
      grade
    )
    if (saved) {
      setIsModalOpen(false)
      setGradeInput("")
      setSelectedSubject(null)
    } else {
      setUpdateError("Error al guardar la nota")
    }
    setUpdating(null)
  }

  const openGradeModal = (subject: PlanSubject) => {
    setSelectedSubject(subject)
    setGradeInput(userSubjects[subject.id]?.grade?.toString() ?? "")
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
    <AuroraBackground className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-6">
          Gestor de Materias
        </h1>
        <p className="text-purple-200 mb-8">
          Gestiona el estado de tus materias y lleva un registro de tu progreso
          académico.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <p className="text-sm font-medium text-purple-200">Filtrar por:</p>
          <Button
            size="sm"
            onClick={() => setFilter(SubjectFilter.All)}
            variant={filter === SubjectFilter.All ? 'default' : 'outline'}
            className={filter === SubjectFilter.All 
              ? 'bg-purple-600 border-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-transparent border-purple-500/30 text-white hover:bg-white/10'}
          >
            Todas
          </Button>
          <Button
            size="sm"
            onClick={() => setFilter(SubjectFilter.Basic)}
            variant={filter === SubjectFilter.Basic ? 'default' : 'outline'}
            className={filter === SubjectFilter.Basic 
              ? 'bg-purple-600 border-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-transparent border-purple-500/30 text-white hover:bg-white/10'}
            disabled={cienciasBasicasSubjects.length === 0}
          >
            Ciencias Básicas
          </Button>
          <Button
            size="sm"
            onClick={() => setFilter(SubjectFilter.Career)}
            variant={filter === SubjectFilter.Career ? 'default' : 'outline'}
            className={filter === SubjectFilter.Career 
              ? 'bg-purple-600 border-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-transparent border-purple-500/30 text-white hover:bg-white/10'}
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
            className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-300 text-sm">{updateError}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUpdateError(null)}
              className="text-red-300 hover:text-red-200 hover:bg-red-800/30 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
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
                onChange={e => setGradeInput(e.target.value)}
                min="1"
                max="10"
              />
              <Button onClick={handleGradeSubmit} disabled={updating !== null}>
                {updating ? "Guardando..." : "Guardar Nota"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </AuroraBackground>
  )
}
