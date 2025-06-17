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
import { useUserSubjectsStore, SubjectStatus } from "@/stores/useUserSubjectsStore"
import { useAuthStore } from "@/stores/useAuthStore"
import { useCareerStore } from "@/stores/useCareerStore"
import { useCorrelativesData } from "@/app/dashboard/_hooks/useCorrelativesData"
import { NotebookPen, Loader2, AlertCircle, X } from "lucide-react"
import DeniedAccess from "./_components/DeniedAccess"
import LoadingSubjects from "./_components/LoadingSubjects"
import { Subject } from "@/types/types"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export const statusLabels: Record<SubjectStatus, string> = {
  no_cursada: "No Cursando",
  cursando: "Cursando",
  regular: "Regular",
  promocionada: "Promocionado",
}

export const statusColors: Record<SubjectStatus, string> = {
  no_cursada: "bg-gray-600",
  cursando: "bg-blue-600",
  regular: "bg-yellow-600",
  promocionada: "bg-green-600",
}

export default function MateriasPage() {
  const { user } = useAuthStore()
  const { selectedCareer, careerNames } = useCareerStore()
  const {
    userSubjects,
    isLoading: userSubjectsLoading,
    updateUserSubjectState,
    fetchUserSubjects,
  } = useUserSubjectsStore()

  const [allSubjects, setAllSubjects] = useState<Subject[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [gradeInput, setGradeInput] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [updating, setUpdating] = useState<number | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'basic' | 'career'>('all')

  useEffect(() => {
    const fetchAllSubjectsForCareer = async () => {
      if (!selectedCareer) return;

      setSubjectsLoading(true);
      setError(null);
      const supabase = getSupabaseBrowserClient();
      
      try {
        // Fetch career-specific subjects
        const { data: careerData, error: careerError } = await supabase
          .from('complete_subjects_info')
          .select('*')
          .eq('career_code', selectedCareer.code);

        if (careerError) throw careerError;

        // Fetch basic subjects
        const { data: basicData, error: basicError } = await supabase
          .from('complete_subjects_info')
          .select('*')
          .eq('career_code', 'CB');
        
        if (basicError) throw basicError;

        const combinedData = [...(careerData || []), ...(basicData || [])];
        setAllSubjects(combinedData);
        
      } catch (e: any) {
        setError(e.message);
        setAllSubjects([]);
      } finally {
        setSubjectsLoading(false);
      }
    };

    fetchAllSubjectsForCareer();
  }, [selectedCareer]);

  useEffect(() => {
    if (user && selectedCareer) {
      fetchUserSubjects(user, selectedCareer.code);
    }
  }, [user, selectedCareer, fetchUserSubjects]);

  const subjectsWithStatus = allSubjects.map(subject => ({
    ...subject,
    status: userSubjects[subject.subject_number]?.status || "no_cursada",
    grade: userSubjects[subject.subject_number]?.grade || null,
  }))

  const cienciasBasicasSubjects = subjectsWithStatus.filter(s => s.career_code === 'CB');
  const careerSubjects = subjectsWithStatus.filter(s => s.career_code !== 'CB');
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
              key={subject.subject_number}
              className="bg-white/5 border-purple-500/20 hover:bg-white/10 transition-colors"
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-white font-medium text-sm leading-tight">
                      {subject.subject_name}
                    </h3>
                    {subject.status === "promocionada" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openGradeModal(subject)}
                        className="h-8 w-8 p-0 text-purple-300 hover:text-white hover:bg-purple-700/30"
                        disabled={updating === subject.subject_number}
                      >
                        <NotebookPen className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Select
                      value={subject.status}
                      onValueChange={value =>
                        handleStatusChange(
                          subject.subject_number,
                          value as SubjectStatus
                        )
                      }
                      disabled={updating === subject.subject_number}
                    >
                      <SelectTrigger className="h-8 text-xs bg-transparent border-purple-500/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(
                          ([status, label]) => (
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    statusColors[status as SubjectStatus]
                                  }`}
                                />
                                {label}
                              </div>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    {subject.status === "promocionada" && subject.grade && (
                      <div className="text-xs text-green-300 font-medium">
                        Nota: {subject.grade}/10
                      </div>
                    )}
                    {updating === subject.subject_number && (
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
    subjectNumber: number,
    status: SubjectStatus
  ) => {
    if (!user || !selectedCareer) return
    setUpdating(subjectNumber)
    setUpdateError(null)
    try {
      await updateUserSubjectState(
        user,
        selectedCareer.code,
        subjectNumber,
        status,
        status === "promocionada"
          ? userSubjects[subjectNumber]?.grade
          : null
      )
    } catch (err) {
      console.error("Error inesperado:", err)
      setUpdateError("Error inesperado al actualizar la materia")
    } finally {
      setUpdating(null)
    }
  }

  const handleGradeSubmit = async () => {
    if (!selectedSubject || !user || !selectedCareer) return

    const grade = parseFloat(gradeInput)
    if (isNaN(grade) || grade < 1 || grade > 10) {
      setUpdateError("La nota debe ser un número entre 1 y 10")
      return
    }

    setUpdating(selectedSubject.subject_number)
    setUpdateError(null)
    try {
      await updateUserSubjectState(
        user,
        selectedCareer.code,
        selectedSubject.subject_number,
        "promocionada",
        grade
      )
      setIsModalOpen(false)
      setGradeInput("")
      setSelectedSubject(null)
    } catch (err) {
      console.error("Error inesperado:", err)
      setUpdateError("Error inesperado al guardar la nota")
    } finally {
      setUpdating(null)
    }
  }

  const openGradeModal = (subject: Subject) => {
    setSelectedSubject(subject)
    setGradeInput(userSubjects[subject.subject_number]?.grade?.toString() || "")
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
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            className={filter === 'all' 
              ? 'bg-purple-600 border-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-transparent border-purple-500/30 text-white hover:bg-white/10'}
          >
            Todas
          </Button>
          <Button
            size="sm"
            onClick={() => setFilter('basic')}
            variant={filter === 'basic' ? 'default' : 'outline'}
            className={filter === 'basic' 
              ? 'bg-purple-600 border-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-transparent border-purple-500/30 text-white hover:bg-white/10'}
            disabled={cienciasBasicasSubjects.length === 0}
          >
            Ciencias Básicas
          </Button>
          <Button
            size="sm"
            onClick={() => setFilter('career')}
            variant={filter === 'career' ? 'default' : 'outline'}
            className={filter === 'career' 
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
          { (filter === 'all' || filter === 'basic') && renderSubjectGroup('Ciencias Básicas', cienciasBasicasSubjects) }
          { (filter === 'all' || filter === 'career') && renderSubjectGroup(careerGroupName, careerSubjects) }
        </motion.div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Ingresar nota para {selectedSubject?.subject_name}
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
