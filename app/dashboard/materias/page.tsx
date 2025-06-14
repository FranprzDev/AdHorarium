"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSubjects } from "@/app/dashboard/materias/_hooks/useSubjects"
import { NotebookPen, Loader2, AlertCircle, X } from "lucide-react"
import type { SubjectWithStatus, SubjectStatus } from "@/types/course"
import DeniedAccess from "./_components/DeniedAccess"
import LoadingSubjects from "./_components/LoadingSubjects"
export const statusLabels: Record<SubjectStatus, string> = {
    NO_CURSANDO: "No Cursando",
    CURSANDO: "Cursando",
    REGULAR: "Regular",
    PROMOCIONADO: "Promocionado"
  }
  
  export const statusColors: Record<SubjectStatus, string> = {
    NO_CURSANDO: "bg-gray-600",
    CURSANDO: "bg-blue-600",
    REGULAR: "bg-yellow-600",
    PROMOCIONADO: "bg-green-600"
  }

export default function MateriasPage() {
  const { subjects, loading, error, updateSubjectStatus } = useSubjects()
  const [selectedSubject, setSelectedSubject] = useState<SubjectWithStatus | null>(null)
  const [gradeInput, setGradeInput] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [updating, setUpdating] = useState<number | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const subjectsByCareer = subjects.reduce(
    (acc, subject) => {
      const careerName = subject.career_name || "Sin carrera"
      if (!acc[careerName]) {
        acc[careerName] = []
      }
      acc[careerName].push(subject)
      return acc
    },
    {} as Record<string, SubjectWithStatus[]>
  )

  const careerNames = Object.keys(subjectsByCareer).sort()

  const handleStatusChange = async (subjectId: number, status: SubjectStatus) => {
    setUpdating(subjectId)
    setUpdateError(null)
    try {
      const result = await updateSubjectStatus(subjectId, status)
      if (!result.success) {
        setUpdateError(result.error || "Error desconocido al actualizar la materia")
      }
    } catch (err) {
      console.error("Error inesperado:", err)
      setUpdateError("Error inesperado al actualizar la materia")
    } finally {
      setUpdating(null)
    }
  }

  const handleGradeSubmit = async () => {
    if (!selectedSubject) return
    
    const grade = parseFloat(gradeInput)
    if (isNaN(grade) || grade < 1 || grade > 10) {
      setUpdateError("La nota debe ser un número entre 1 y 10")
      return
    }

    setUpdating(selectedSubject.id)
    setUpdateError(null)
    try {
      const result = await updateSubjectStatus(selectedSubject.id, "PROMOCIONADO", grade)
      if (result.success) {
        setIsModalOpen(false)
        setGradeInput("")
        setSelectedSubject(null)
      } else {
        setUpdateError(result.error || "Error desconocido al guardar la nota")
      }
    } catch (err) {
      console.error("Error inesperado:", err)
      setUpdateError("Error inesperado al guardar la nota")
    } finally {
      setUpdating(null)
    }
  }

  const openGradeModal = (subject: SubjectWithStatus) => {
    setSelectedSubject(subject)
    setGradeInput(subject.grade?.toString() || "")
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

  if (loading) {
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
        <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-6">Gestor de Materias</h1>
        <p className="text-purple-200 mb-8">
          Gestiona el estado de tus materias y lleva un registro de tu progreso académico.
        </p>

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

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          {careerNames.map((careerName) => {
            const careerSubjects = subjectsByCareer[careerName]

            return (
              <motion.div key={careerName} variants={itemVariants} className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Badge className="bg-purple-700 text-white px-3 py-1">{careerName}</Badge>
                  <span className="text-sm text-purple-200">
                    ({careerSubjects.length} materias)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {careerSubjects.map((subject) => (
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
                            {subject.status === "PROMOCIONADO" && (
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
                              onValueChange={(value) => 
                                handleStatusChange(subject.id, value as SubjectStatus)
                              }
                              disabled={updating === subject.id}
                            >
                              <SelectTrigger className="h-8 text-xs bg-transparent border-purple-500/30 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusLabels).map(([status, label]) => (
                                  <SelectItem key={status} value={status}>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className={`w-2 h-2 rounded-full ${statusColors[status as SubjectStatus]}`} 
                                      />
                                      {label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {subject.status === "PROMOCIONADO" && subject.grade && (
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
          })}
        </motion.div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-gray-900 border-purple-500/30">
            <DialogHeader>
              <DialogTitle className="text-white">
                Agregar Nota - {selectedSubject?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {updateError && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-xs">{updateError}</p>
                </div>
              )}
              <div>
                <Label htmlFor="grade" className="text-purple-200">
                  Nota (1-10)
                </Label>
                <Input
                  id="grade"
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  className="bg-transparent border-purple-500/30 text-white mt-1"
                  placeholder="Ingresa la nota obtenida"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-transparent border-purple-500/30 text-white hover:bg-purple-800/30"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGradeSubmit}
                  disabled={updating === selectedSubject?.id}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {updating === selectedSubject?.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Nota"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </AuroraBackground>
  )
}
