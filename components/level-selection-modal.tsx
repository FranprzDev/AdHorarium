"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import type { Course } from "@/types/course"
import { Button } from "@/components/ui/acernity-ui"
import { X, Check } from "lucide-react"

interface LevelSelectionModalProps {
  level: number
  courses: Course[]
  selectedCourses: string[]
  onSelect: (codes: string[]) => void
  onClose: () => void
  modalType: "regular" | "approved"
  approvedCourses?: string[]
}

export default function LevelSelectionModal({
  level,
  courses,
  selectedCourses,
  onSelect,
  onClose,
  modalType,
  approvedCourses = [],
}: LevelSelectionModalProps) {
  const [selected, setSelected] = useState<string[]>(selectedCourses)

  // Get all courses data for looking up names
  const coursesData = useMemo(() => {
    // Find all courses from all levels
    return courses.reduce((allCourses, course) => {
      if (!allCourses.some((c) => c.code === course.code)) {
        allCourses.push(course)
      }
      return allCourses
    }, [] as Course[])
  }, [courses])

  const filteredCourses = useMemo(() => {
    if (modalType === "regular") {
      return courses.filter((course) => !approvedCourses.includes(course.code))
    }
    return courses
  }, [courses, modalType, approvedCourses])

  const regularCourses = useMemo(() => {
    return filteredCourses.filter((course) => !course.isElective)
  }, [filteredCourses])

  const electiveCourses = useMemo(() => {
    return filteredCourses.filter((course) => course.isElective)
  }, [filteredCourses])

  useEffect(() => {
    setSelected(selectedCourses)
  }, [selectedCourses])

  // Auto-scroll to top when modal opens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const toggleCourse = (code: string) => {
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
  }

  const selectAll = () => {
    setSelected(filteredCourses.map((course) => course.code))
  }

  const deselectAll = () => {
    setSelected([])
  }

  const selectAllRegular = () => {
    setSelected((prev) => {
      const regularCodes = regularCourses.map((course) => course.code)
      const electiveCodes = prev.filter((code) => electiveCourses.some((course) => course.code === code))
      return [...regularCodes, ...electiveCodes]
    })
  }

  const selectAllElective = () => {
    setSelected((prev) => {
      const electiveCodes = electiveCourses.map((course) => course.code)
      const regularCodes = prev.filter((code) => regularCourses.some((course) => course.code === code))
      return [...regularCodes, ...electiveCodes]
    })
  }

  const deselectAllElective = () => {
    setSelected((prev) => prev.filter((code) => regularCourses.some((course) => course.code === code)))
  }

  const handleSave = () => {
    onSelect(selected)
    onClose()
  }

  const hasAllPrerequisites = (course: Course) => {
    if (modalType === "regular") {
      return course.aprobadasParaCursar.every((code) => approvedCourses.includes(code))
    }
    return true
  }

  const getMissingPrerequisites = (course: Course) => {
    if (modalType !== "regular") return []

    return course.aprobadasParaCursar
      .filter((code) => !approvedCourses.includes(code))
      .map((code) => {
        const prereqCourse = coursesData.find((c) => c.code === code)
        return prereqCourse ? prereqCourse.name : code
      })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-3xl mx-4 max-h-[90vh] bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-700"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
          <h2 className="text-xl font-bold text-white">
            {modalType === "approved" ? "Seleccionar materias aprobadas" : "Seleccionar materias regulares"} - Nivel{" "}
            {level}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 transition-colors text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          <div className="flex flex-wrap justify-between gap-2 mb-4">
            <Button
              onClick={selectAll}
              variant="outline"
              className="text-sm px-4 bg-transparent border-white text-white hover:bg-slate-700"
            >
              Seleccionar todas
            </Button>
            <Button
              onClick={deselectAll}
              variant="outline"
              className="text-sm px-4 bg-transparent border-white text-white hover:bg-slate-700"
            >
              Deseleccionar todas
            </Button>
          </div>

          {/* Regular Courses */}
          {regularCourses.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-white font-semibold">Materias Disponibles para Cursar</h3>
                <Button
                  onClick={selectAllRegular}
                  variant="outline"
                  className="text-xs px-4 py-1 h-auto bg-transparent border-white text-white hover:bg-slate-700"
                >
                  Seleccionar todas
                </Button>
              </div>
              <div className="space-y-2">
                {regularCourses.map((course) => {
                  const isPrerequisitesMet = hasAllPrerequisites(course)
                  return (
                    <div
                      key={course.code}
                      className={`
                        flex items-center p-3 rounded-lg cursor-pointer transition-colors
                        ${selected.includes(course.code) ? "bg-violet-900/40" : "bg-slate-800 hover:bg-slate-700"}
                        ${!isPrerequisitesMet && "opacity-50"}
                      `}
                      onClick={() => isPrerequisitesMet && toggleCourse(course.code)}
                    >
                      <div
                        className={`
                          w-5 h-5 rounded-md mr-3 flex items-center justify-center
                          ${selected.includes(course.code) ? "bg-violet-500" : "border border-slate-500"}
                          ${!isPrerequisitesMet && "bg-gray-500 border-gray-600"}
                        `}
                      >
                        {selected.includes(course.code) && <Check size={14} className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{course.name}</p>
                        {!isPrerequisitesMet && (
                          <>
                            <p className="text-xs text-orange-400 mt-1">
                              Faltan correlativas para {modalType === "regular" ? "cursar" : "aprobar"}
                            </p>
                            {getMissingPrerequisites(course).length > 0 && (
                              <p className="text-xs text-orange-300 mt-0.5">
                                Necesitas: {getMissingPrerequisites(course).join(", ")}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Elective Courses */}
          {electiveCourses.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-white font-semibold">Materias Electivas</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={selectAllElective}
                    variant="outline"
                    className="text-xs px-4 py-1 h-auto bg-transparent border-white text-white hover:bg-slate-700"
                  >
                    Seleccionar todas
                  </Button>
                  <Button
                    onClick={deselectAllElective}
                    variant="outline"
                    className="text-xs px-4 py-1 h-auto bg-transparent border-white text-white hover:bg-slate-700"
                  >
                    Deseleccionar todas
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {electiveCourses.map((course) => {
                  const isPrerequisitesMet = hasAllPrerequisites(course)
                  return (
                    <div
                      key={course.code}
                      className={`
                        flex items-center p-3 rounded-lg cursor-pointer transition-colors
                        ${selected.includes(course.code) ? "bg-purple-900/40" : "bg-slate-800 hover:bg-slate-700"}
                        ${!isPrerequisitesMet && "opacity-50"}
                      `}
                      onClick={() => isPrerequisitesMet && toggleCourse(course.code)}
                    >
                      <div
                        className={`
                          w-5 h-5 rounded-md mr-3 flex items-center justify-center
                          ${selected.includes(course.code) ? "bg-purple-500" : "border border-slate-500"}
                          ${!isPrerequisitesMet && "bg-gray-500 border-gray-600"}
                        `}
                      >
                        {selected.includes(course.code) && <Check size={14} className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{course.name}</p>
                        {!isPrerequisitesMet && (
                          <p className="text-xs text-orange-400 mt-1">
                            Faltan correlativas para {modalType === "regular" ? "cursar" : "aprobar"}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-20 p-4 border-t border-slate-700 flex justify-end bg-slate-900">
          <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700 text-white px-4">
            Guardar selección
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
