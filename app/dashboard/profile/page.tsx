"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { PageHeader } from "@/components/brand/page-header"
import { CareerSelectionModal } from "@/components/career-selection-modal"
import { toast } from "sonner"
import { useCareerStore } from "@/stores/useCareerStore"
import { useProfile } from "./_hooks/useProfile"
import { convertToGPA } from "@/lib/gpa"
import {
  ProfileHeader,
  AverageGradeCard,
  SubjectsCountCard,
  AcademicProgressCard,
  GPAConversionCard
} from "./_components"

export default function ProfilePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const selectCareerById = useCareerStore((state) => state.selectCareerById)
  const {
    profile,
    careers,
    averageGrade,
    approvedSubjectsCount,
    isLoading,
    error,
    handleCareerChange
  } = useProfile()

  const selectedCareerName = profile?.careerName ?? "No asignada"

  const gpaEquivalent = averageGrade !== null ? convertToGPA(averageGrade) : null

  const onCareerChange = async (careerId: number) => {
    const result = await handleCareerChange(careerId)
    if (!result.ok) {
      toast.error("No se pudo cambiar la carrera.", { description: result.error })
      return
    }
    selectCareerById(result.data)
    setIsModalOpen(false)
    toast.success("Carrera actualizada")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground" role="status" aria-live="polite">
        Cargando perfil...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="surface-card border-destructive/40 p-6 text-destructive">Error: {error}</div>
      </div>
    )
  }

  return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <PageHeader eyebrow="Tu cuenta" title="Mi Perfil" description="Gestioná tu información académica y personal" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-4"
          >
            <ProfileHeader
              profile={profile}
              onCareerChangeClick={() => setIsModalOpen(true)}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <AverageGradeCard
                averageGrade={averageGrade}
                approvedSubjectsCount={approvedSubjectsCount}
              />

              <SubjectsCountCard
                approvedSubjectsCount={approvedSubjectsCount}
              />
            </div>

            <AcademicProgressCard
              approvedSubjectsCount={approvedSubjectsCount}
              averageGrade={averageGrade}
              gpaEquivalent={gpaEquivalent}
              selectedCareerName={selectedCareerName}
            />

            <GPAConversionCard />
          </motion.div>
        </div>

        {isModalOpen && (
          <CareerSelectionModal
            isOpen={isModalOpen}
            careers={careers}
            currentCareerId={profile?.careerId ?? null}
            onSelectCareer={onCareerChange}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </motion.div>
  )
}
