"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { CareerSelectionModal } from "@/components/career-selection-modal"
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
    await handleCareerChange(careerId)
    setIsModalOpen(false)
  }

  if (isLoading) {
    return (
      <AuroraBackground className="min-h-screen">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-white text-xl">Cargando perfil...</div>
        </div>
      </AuroraBackground>
    )
  }

  if (error) {
    return (
      <AuroraBackground className="min-h-screen">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-red-400 text-xl">Error: {error}</div>
        </div>
      </AuroraBackground>
    )
  }

  return (
    <AuroraBackground className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">Mi Perfil</h1>
          <p className="text-purple-200 text-lg">Gestiona tu información académica y personal</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
    </AuroraBackground>
  )
}
