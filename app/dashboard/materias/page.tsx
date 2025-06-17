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
import { LevelSelectionModal } from "@/components/level-selection-modal"
import { toast } from "sonner"
import { SubjectCard } from "@/components/subjects/subject-card"
import { useAuthStore } from "@/stores/useAuthStore"
import { CareerSelectionModal } from "@/components/career-selection-modal"

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
  const {
    subjects,
    loading,
    error,
    updateSubjectStatus,
    selectedLevel,
    setSelectedLevel
  } = useSubjects()
  const [isCareerModalOpen, setCareerModalOpen] = useState(false)
  const [isLevelModalOpen, setLevelModalOpen] = useState(false)
  const { user } = useAuthStore()
  const [selectedSubject, setSelectedSubject] = useState<SubjectWithStatus | null>(null)
  const [gradeInput, setGradeInput] = useState("")
  const [updating, setUpdating] = useState<number | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  if (loading) return <LoadingSubjects />
  if (error) return <DeniedAccess message={error} />
  if (!user) return <DeniedAccess />

  const filteredSubjects = selectedLevel
    ? subjects.filter(subject => subject.level === selectedLevel)
    : subjects

  const levels = Array.from(new Set(subjects.map(s => s.level))).sort(
    (a, b) => a - b
  )

  const handleUpdateSubjectStatus = async (
    subjectId: number,
    status: "PENDING" | "APPROVED" | "DISAPPROVED"
  ) => {
    const result = await updateSubjectStatus(subjectId, status)
    if (result.success) {
      console.log("Estado de la materia actualizado con éxito")
    } else {
      console.error("Error al actualizar el estado de la materia:", result.error)
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

        <header className='mb-6 flex flex-col md:flex-row items-center justify-between gap-4'>
          <h1 className='text-3xl font-bold text-white'>Materias</h1>
          <div className='flex items-center gap-4'>
            <Button
              onClick={() =>
                toast.info("Función deshabilitada", {
                  description:
                    "La selección de carrera no está disponible en esta sección."
                })
              }
              className='cursor-not-allowed opacity-50'
            >
              Cambiar Carrera
            </Button>
            <Button onClick={() => setLevelModalOpen(true)}>
              Seleccionar Nivel
            </Button>
          </div>
        </header>

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

        {selectedLevel && (
          <div className='mb-4'>
            <h2 className='text-2xl font-semibold'>Nivel {selectedLevel}</h2>
          </div>
        )}

        {filteredSubjects.length > 0 ? (
          <motion.div
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {filteredSubjects.map(subject => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SubjectCard
                  subject={subject}
                  onStatusChange={handleUpdateSubjectStatus}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className='text-center py-10'>
            <p className='text-lg'>
              {selectedLevel
                ? "No hay materias para el nivel seleccionado."
                : "No hay materias para mostrar. Selecciona un nivel."}
            </p>
          </div>
        )}

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

        <LevelSelectionModal
          isOpen={isLevelModalOpen}
          onClose={() => setLevelModalOpen(false)}
          levels={levels}
          selectedLevel={selectedLevel}
          onSelectLevel={setSelectedLevel}
        />

        <CareerSelectionModal
          isOpen={isCareerModalOpen}
          onClose={() => setCareerModalOpen(false)}
        />
      </motion.div>
    </AuroraBackground>
  )
}
