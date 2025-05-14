"use client"

import type React from "react"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Course } from "@/types/course"
import { Badge, Button } from "@/components/ui/acernity-ui"
import LevelSelectionModal from "./level-selection-modal"
import { X, Calendar, ArrowRight, Clock, Download } from "lucide-react"
import html2canvas from "html2canvas"

// Cambiar el orden de los pasos (primero aprobadas, luego regulares)
// Modificar el tipo SelectionMode
type SelectionMode = "approved" | "regular" | "schedule"
type TimeSlot = "morning" | "afternoon" | "evening"

interface ScheduleGeneratorProps {
  coursesData: Course[]
  onClose: () => void
}

export default function ScheduleGenerator({ coursesData, onClose }: ScheduleGeneratorProps) {
  // Actualizar el estado inicial para comenzar con aprobadas
  const [mode, setMode] = useState<SelectionMode>("approved")
  const [selectedRegular, setSelectedRegular] = useState<string[]>([])
  const [selectedApproved, setSelectedApproved] = useState<string[]>([])
  const [possibleCourses, setPossibleCourses] = useState<Course[]>([])
  const [currentLevelModal, setCurrentLevelModal] = useState<number | null>(null)
  const [modalType, setModalType] = useState<"regular" | "approved">("regular")
  const [timeSlot, setTimeSlot] = useState<TimeSlot | null>(null)
  const scheduleRef = useRef<HTMLDivElement>(null)
  const [scheduledCourses, setScheduledCourses] = useState<{
    [key: string]: { course: Course; day: number; startSlot: number }
  }>({})
  const [draggingCourse, setDraggingCourse] = useState<Course | null>(null)
  const initialApproved: string[] = []

  // Group courses by level
  const coursesByLevel = useMemo(() => {
    const result: Record<number, Course[]> = {}

    coursesData.forEach((course) => {
      const level = course.level
      if (!result[level]) {
        result[level] = []
      }
      result[level].push(course)
    })

    return result
  }, [coursesData])

  // Get sorted levels
  const levels = useMemo(() => {
    return Object.keys(coursesByLevel)
      .map(Number)
      .sort((a, b) => a - b)
  }, [coursesByLevel])

  // Remove automatic selection of Level 1 courses
  useEffect(() => {
    setSelectedApproved([])
  }, [])

  // Verificar automáticamente si se cumplen los requisitos para cursar materias
  useEffect(() => {
    // Verificar si hay materias que ahora son elegibles para cursar
    const checkEligibleCourses = () => {
      coursesData.forEach((course) => {
        // Si ya está aprobada o regular, no hacer nada
        if (selectedApproved.includes(course.code) || selectedRegular.includes(course.code)) {
          return
        }

        // Verificar si todas las correlativas para cursar están cumplidas
        const allRegularsSelected = course.regularesParaCursar.every(
          (reqCode) => selectedRegular.includes(reqCode) || selectedApproved.includes(reqCode),
        )

        const allApprovedSelected = course.aprobadasParaCursar.every((reqCode) => selectedApproved.includes(reqCode))
      })
    }

    checkEligibleCourses()
  }, [selectedApproved, selectedRegular, coursesData])

  const handleDragStart = (course: Course) => {
    setDraggingCourse(course)
  }

  const handleDragOver = (e: React.DragEvent, day: number, slot: number) => {
    e.preventDefault()
    if (draggingCourse) {
      // Show preview of where the course would be placed
    }
  }

  const handleDrop = (e: React.DragEvent, day: number, slot: number) => {
    e.preventDefault()
    if (draggingCourse) {
      setScheduledCourses((prev) => ({
        ...prev,
        [draggingCourse.code]: { course: draggingCourse, day, startSlot: slot },
      }))
      setDraggingCourse(null)
    }
  }

  const handleDownloadSchedule = async () => {
    if (scheduleRef.current) {
      try {
        const canvas = await html2canvas(scheduleRef.current)
        const dataUrl = canvas.toDataURL("image/png")
        const link = document.createElement("a")
        link.download = "horario.png"
        link.href = dataUrl
        link.click()
      } catch (error) {
        console.error("Error al generar la imagen:", error)
      }
    }
  }

  const openLevelModal = (level: number, type: "regular" | "approved") => {
    setCurrentLevelModal(level)
    setModalType(type)
  }

  const handleLevelSelection = (codes: string[]) => {
    if (modalType === "regular") {
      setSelectedRegular((prev) => {
        // Remove any existing courses from this level
        const filteredPrev = prev.filter((code) => {
          const course = coursesData.find((c) => c.code === code)
          return course?.level !== currentLevelModal
        })
        // Add the newly selected courses
        return [...filteredPrev, ...codes]
      })
    } else {
      setSelectedApproved((prev) => {
        // Remove any existing courses from this level
        const filteredPrev = prev.filter((code) => {
          const course = coursesData.find((c) => c.code === code)
          return course?.level !== currentLevelModal
        })
        // Add the newly selected courses
        return [...filteredPrev, ...codes]
      })
    }
  }

  const handleRegularSelection = useCallback((code: string) => {
    setSelectedRegular((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
  }, [])

  const handleApprovedSelection = useCallback((code: string) => {
    setSelectedApproved((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
  }, [])

  // Modificar la función handleContinue para el nuevo flujo y corregir la lógica para 4to año
  const handleContinue = useCallback(() => {
    if (mode === "approved") {
      setMode("regular")
    } else if (mode === "regular") {
      // Generar posibles cursos y pasar directamente a la pantalla de horario
      const availableCourses = coursesData.filter((course) => {
        // Skip if already approved
        if (selectedApproved.includes(course.code)) {
          return false
        }

        // Check if all required regular courses are selected
        const allRegularsSelected = course.regularesParaCursar.every(
          (reqCode) => selectedRegular.includes(reqCode) || selectedApproved.includes(reqCode),
        )

        // Check if all required approved courses are selected
        const allApprovedSelected = course.aprobadasParaCursar.every((reqCode) => selectedApproved.includes(reqCode))

        return allRegularsSelected && allApprovedSelected
      })

      // Ordenar por nivel para mejor visualización
      availableCourses.sort((a, b) => a.level - b.level)

      setPossibleCourses(availableCourses)
      setMode("schedule")
    } else if (mode === "schedule") {
      // Cerrar el generador de horarios cuando se presiona "Finalizar"
      onClose()
    }
  }, [mode, coursesData, selectedRegular, selectedApproved, onClose])

  // Modificar la función handleBack para el nuevo flujo
  const handleBack = useCallback(() => {
    if (mode === "regular") {
      setMode("approved")
    } else if (mode === "schedule") {
      setMode("regular")
    }
  }, [mode])

  const selectTimeSlot = (slot: TimeSlot) => {
    setTimeSlot(slot)
  }

  const regularCourses = useMemo(() => {
    return coursesData.filter((course) => !selectedApproved.includes(course.code) && course.level > 1)
  }, [coursesData, selectedApproved])

  const approvedCourses = useMemo(() => {
    return coursesData.filter(
      (course) => !initialApproved.includes(course.code) && !selectedRegular.includes(course.code) && course.level > 1,
    )
  }, [coursesData, initialApproved, selectedRegular])

  // Group possible courses by level
  const possibleCoursesByLevel = useMemo(() => {
    const result: Record<number, Course[]> = {}

    possibleCourses.forEach((course) => {
      const level = course.level
      if (!result[level]) {
        result[level] = []
      }
      result[level].push(course)
    })

    return result
  }, [possibleCourses])

  // Get sorted levels for possible courses
  const possibleLevels = useMemo(() => {
    return Object.keys(possibleCoursesByLevel)
      .map(Number)
      .sort((a, b) => a - b)
  }, [possibleCoursesByLevel])

  // Agregar función para generar los intervalos de tiempo según el turno seleccionado
  const generateTimeSlots = () => {
    if (!timeSlot) return []

    let startHour, endHour

    if (timeSlot === "morning") {
      startHour = 8
      endHour = 13.25
    } else if (timeSlot === "afternoon") {
      startHour = 13.25
      endHour = 19.25
    } else {
      // evening
      startHour = 17.5
      endHour = 23.5
    }

    const slots = []
    for (let hour = startHour; hour < endHour; hour += 0.75) {
      const hourPart = Math.floor(hour)
      const minutePart = Math.round((hour - hourPart) * 60)
      slots.push(`${hourPart.toString().padStart(2, "0")}:${minutePart.toString().padStart(2, "0")}`)
    }

    return slots
  }

  // Agregar función para añadir un curso al horario
  const addCourseToSchedule = (course: Course) => {
    // Aquí iría la lógica para añadir el curso al horario
    console.log(`Añadiendo curso ${course.name} al horario`)
  }

  // Update the schedule view to include drag and drop
  const renderSchedule = () => {
    return (
      <div ref={scheduleRef} className="bg-white rounded-lg overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="p-2 border border-slate-700 w-20">Hora</th>
                {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map((day, index) => (
                  <th key={day} className="p-2 border border-slate-700">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {generateTimeSlots().map((time, slotIndex) => (
                <tr key={time} className={slotIndex % 2 === 0 ? "bg-slate-100" : "bg-white"}>
                  <td className="p-2 border border-slate-300 text-center font-medium">{time}</td>
                  {[0, 1, 2, 3, 4].map((day) => (
                    <td
                      key={`${day}-${slotIndex}`}
                      className="p-2 border border-slate-300 h-12 relative"
                      onDragOver={(e) => handleDragOver(e, day, slotIndex)}
                      onDrop={(e) => handleDrop(e, day, slotIndex)}
                    >
                      {Object.entries(scheduledCourses).map(([code, data]) => {
                        if (data.day === day && data.startSlot === slotIndex) {
                          return (
                            <div
                              key={code}
                              className={`absolute inset-0 m-1 rounded p-1 text-xs ${
                                data.course.isElective
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-violet-100 text-violet-800"
                              }`}
                            >
                              {data.course.name}
                            </div>
                          )
                        }
                        return null
                      })}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Update the course list to be draggable
  const renderCourseList = () => {
    // Separar materias regulares y electivas
    const regularCoursesByLevel: Record<number, Course[]> = {}
    const electiveCoursesByLevel: Record<number, Course[]> = {}

    possibleLevels.forEach((level) => {
      const levelCourses = possibleCoursesByLevel[level]
      regularCoursesByLevel[level] = levelCourses.filter((course) => !course.isElective)
      electiveCoursesByLevel[level] = levelCourses.filter((course) => course.isElective)
    })

    // Obtener niveles que tienen materias regulares y electivas
    const regularLevels = Object.keys(regularCoursesByLevel)
      .filter((level) => regularCoursesByLevel[Number.parseInt(level)].length > 0)
      .map(Number)
      .sort((a, b) => a - b)

    const electiveLevels = Object.keys(electiveCoursesByLevel)
      .filter((level) => electiveCoursesByLevel[Number.parseInt(level)].length > 0)
      .map(Number)
      .sort((a, b) => a - b)

    return (
      <div className="w-80 bg-white/10 rounded-lg p-6 overflow-hidden">
        <h3 className="text-xl font-bold text-white mb-4">Materias disponibles</h3>

        {possibleCourses.length > 0 ? (
          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 overflow-x-hidden">
            {/* Materias Regulares */}
            {regularLevels.length > 0 && (
              <div>
                <h4 className="text-white font-semibold mb-3 border-b border-white/20 pb-1">
                  Materias Disponibles para Cursar
                </h4>
                <div className="space-y-4">
                  {regularLevels.map((level) => (
                    <div key={`regular-${level}`}>
                      <h5 className="text-white font-medium mb-2 sticky top-0 bg-slate-800 p-2 rounded">
                        Nivel {level}
                      </h5>
                      <div className="space-y-2">
                        {regularCoursesByLevel[level].map((course) => (
                          <div
                            key={course.code}
                            draggable
                            onDragStart={() => handleDragStart(course)}
                            className="p-3 rounded-lg cursor-move transition-all bg-violet-100 dark:bg-violet-900/40 hover:bg-violet-200 dark:hover:bg-violet-900/60"
                          >
                            <p className="font-medium">{course.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{course.hours} horas semanales</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Materias Electivas */}
            {electiveLevels.length > 0 && (
              <div>
                <h4 className="text-white font-semibold mb-3 border-b border-white/20 pb-1">Materias Electivas</h4>
                <div className="space-y-4">
                  {electiveLevels.map((level) => (
                    <div key={`elective-${level}`}>
                      <h5 className="text-white font-medium mb-2 sticky top-0 bg-slate-800 p-2 rounded">
                        Nivel {level}
                      </h5>
                      <div className="space-y-2">
                        {electiveCoursesByLevel[level].map((course) => (
                          <div
                            key={course.code}
                            draggable
                            onDragStart={() => handleDragStart(course)}
                            className="p-3 rounded-lg cursor-move transition-all bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200 dark:hover:bg-purple-900/60"
                          >
                            <p className="font-medium">{course.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{course.hours} horas semanales</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {regularLevels.length === 0 && electiveLevels.length === 0 && (
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <p className="text-white">No hay materias disponibles para cursar</p>
                <p className="text-sm text-slate-300 mt-2">Necesitas aprobar más materias para poder avanzar.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <p className="text-white">No hay materias disponibles para cursar</p>
            <p className="text-sm text-slate-300 mt-2">Necesitas aprobar más materias para poder avanzar.</p>
          </div>
        )}
      </div>
    )
  }

  // Update the schedule step content
  const renderScheduleStep = () => (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Selecciona tu turno de cursado</h2>
        <p className="text-slate-300">¿En qué turno prefieres cursar las materias seleccionadas?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`
            bg-white/10 rounded-lg p-6 text-center cursor-pointer transition-all
            ${timeSlot === "morning" ? "ring-2 ring-violet-500 bg-violet-900/20" : "hover:bg-white/20"}
          `}
          onClick={() => selectTimeSlot("morning")}
        >
          <div className="flex justify-center mb-4">
            <Clock size={48} className="text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Turno Mañana</h3>
          <p className="text-slate-300">8:00 - 13:15</p>
        </div>

        <div
          className={`
            bg-white/10 rounded-lg p-6 text-center cursor-pointer transition-all
            ${timeSlot === "afternoon" ? "ring-2 ring-violet-500 bg-violet-900/20" : "hover:bg-white/20"}
          `}
          onClick={() => selectTimeSlot("afternoon")}
        >
          <div className="flex justify-center mb-4">
            <Clock size={48} className="text-orange-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Turno Tarde</h3>
          <p className="text-slate-300">13:15 - 19:15</p>
        </div>

        <div
          className={`
            bg-white/10 rounded-lg p-6 text-center cursor-pointer transition-all
            ${timeSlot === "evening" ? "ring-2 ring-violet-500 bg-violet-900/20" : "hover:bg-white/20"}
          `}
          onClick={() => selectTimeSlot("evening")}
        >
          <div className="flex justify-center mb-4">
            <Clock size={48} className="text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Turno Noche</h3>
          <p className="text-slate-300">17:30 - 23:30</p>
        </div>
      </div>

      {timeSlot && (
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex gap-6 flex-wrap">
            <div className="flex-1 bg-white/10 rounded-lg p-6 min-w-0 overflow-hidden">
              <h3 className="text-xl font-bold text-white mb-4">Tu horario generado</h3>
              {renderSchedule()}
              <div className="flex justify-end mt-4 gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadSchedule}
                  className="bg-transparent border-white text-white hover:bg-white/10 px-4 flex items-center gap-2"
                >
                  <Download size={16} />
                  Descargar
                </Button>
              </div>
            </div>
            {renderCourseList()}
          </div>
        </motion.div>
      )}
    </>
  )

  const renderGuideInfo = () => {
    if (mode !== "approved") return null

    return (
      <div className="mb-6 bg-blue-900/30 p-4 rounded-lg border border-blue-500/30">
        <h3 className="text-blue-300 font-semibold mb-2">Guía de uso</h3>
        <ol className="list-decimal list-inside text-blue-200 space-y-2 text-sm">
          <li>
            Primero, selecciona todas las materias que ya tienes <strong>aprobadas</strong> (con final)
          </li>
          <li>
            Luego selecciona las materias que tienes como <strong>regular</strong> (cursadas pero sin final)
          </li>
          <li>El sistema te mostrará qué materias puedes cursar según el régimen de correlatividades</li>
        </ol>
      </div>
    )
  }

  // Reemplazar el renderStepContent con la nueva implementación
  const renderStepContent = () => {
    switch (mode) {
      case "approved":
        return (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Paso 1: Selecciona tus materias aprobadas</h2>
              <p className="text-slate-300">Selecciona las materias que ya tienes aprobadas (con final)</p>
            </div>
            {renderGuideInfo()}
            <div className="space-y-6">
              {levels.map((level) => {
                const levelCourses = coursesByLevel[level]
                const regularCourses = levelCourses.filter((course) => !course.isElective)
                const electiveCourses = levelCourses.filter((course) => course.isElective)

                const selectedRegularCount = regularCourses.filter((course) =>
                  selectedApproved.includes(course.code),
                ).length

                const selectedElectiveCount = electiveCourses.filter((course) =>
                  selectedApproved.includes(course.code),
                ).length

                return (
                  <div key={level} className="bg-white/5 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4 flex-wrap">
                      <h3 className="text-lg font-semibold text-white flex items-center flex-wrap">
                        <Badge color="primary" className="mr-2">
                          Nivel {level}
                        </Badge>
                        {(selectedRegularCount > 0 || selectedElectiveCount > 0) && (
                          <span className="text-sm text-slate-300 ml-2">
                            ({selectedRegularCount + selectedElectiveCount} de {levelCourses.length} seleccionadas)
                          </span>
                        )}
                      </h3>
                      <Button
                        onClick={() => openLevelModal(level, "approved")}
                        variant="outline"
                        className="text-sm px-3 bg-transparent border-white text-white hover:bg-white/10"
                      >
                        Seleccionar materias
                      </Button>
                    </div>

                    {regularCourses.length > 0 && (
                      <div className="mb-4 overflow-hidden">
                        <h4 className="text-white text-sm font-medium mb-2">Materias Disponibles para Cursar:</h4>
                        {selectedRegularCount > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {regularCourses
                              .filter((course) => selectedApproved.includes(course.code))
                              .map((course) => (
                                <div
                                  key={course.code}
                                  className="bg-violet-100 dark:bg-violet-900/40 rounded-lg p-2 text-sm truncate"
                                >
                                  {course.name}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 italic">No hay materias aprobadas seleccionadas</p>
                        )}
                      </div>
                    )}

                    {electiveCourses.length > 0 && (
                      <div className="overflow-hidden">
                        <h4 className="text-white text-sm font-medium mb-2">Materias Electivas:</h4>
                        {selectedElectiveCount > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {electiveCourses
                              .filter((course) => selectedApproved.includes(course.code))
                              .map((course) => (
                                <div
                                  key={course.code}
                                  className="bg-purple-100 dark:bg-purple-900/40 rounded-lg p-2 text-sm truncate"
                                >
                                  {course.name}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 italic">No hay materias electivas seleccionadas</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )
      case "regular":
        return (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Paso 2: Selecciona tus materias regulares</h2>
              <p className="text-slate-300">
                Selecciona las materias que tienes como regular (cursadas pero no aprobadas)
              </p>
            </div>

            <div className="space-y-6">
              {levels.map((level) => {
                // Filtrar materias que ya están aprobadas
                const levelCourses = coursesByLevel[level].filter((course) => !selectedApproved.includes(course.code))

                const regularCourses = levelCourses.filter((course) => !course.isElective)
                const electiveCourses = levelCourses.filter((course) => course.isElective)

                const selectedRegularCount = regularCourses.filter((course) =>
                  selectedRegular.includes(course.code),
                ).length

                const selectedElectiveCount = electiveCourses.filter((course) =>
                  selectedRegular.includes(course.code),
                ).length

                // Si no hay materias para mostrar después de filtrar, no mostrar este nivel
                if (levelCourses.length === 0) return null

                return (
                  <div key={level} className="bg-white/5 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4 flex-wrap">
                      <h3 className="text-lg font-semibold text-white flex items-center flex-wrap">
                        <Badge color="primary" className="mr-2">
                          Nivel {level}
                        </Badge>
                        {(selectedRegularCount > 0 || selectedElectiveCount > 0) && (
                          <span className="text-sm text-slate-300 ml-2">
                            ({selectedRegularCount + selectedElectiveCount} de {levelCourses.length} seleccionadas)
                          </span>
                        )}
                      </h3>
                      <Button
                        onClick={() => openLevelModal(level, "regular")}
                        variant="outline"
                        className="text-sm px-3 bg-transparent border-white text-white hover:bg-white/10"
                      >
                        Seleccionar materias
                      </Button>
                    </div>

                    {regularCourses.length > 0 && (
                      <div className="mb-4 overflow-hidden">
                        <h4 className="text-white text-sm font-medium mb-2">Materias Disponibles para Cursar:</h4>
                        {selectedRegularCount > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {regularCourses
                              .filter((course) => selectedRegular.includes(course.code))
                              .map((course) => (
                                <div
                                  key={course.code}
                                  className="bg-violet-100 dark:bg-violet-900/40 rounded-lg p-2 text-sm truncate"
                                >
                                  {course.name}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 italic">No hay materias regulares seleccionadas</p>
                        )}
                      </div>
                    )}

                    {electiveCourses.length > 0 && (
                      <div className="overflow-hidden">
                        <h4 className="text-white text-sm font-medium mb-2">Materias Electivas:</h4>
                        {selectedElectiveCount > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {electiveCourses
                              .filter((course) => selectedRegular.includes(course.code))
                              .map((course) => (
                                <div
                                  key={course.code}
                                  className="bg-purple-100 dark:bg-purple-900/40 rounded-lg p-2 text-sm truncate"
                                >
                                  {course.name}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 italic">No hay materias electivas seleccionadas</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )
      case "schedule":
        return renderScheduleStep()
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto overflow-x-hidden">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto bg-slate-900 rounded-xl shadow-xl overflow-hidden">
          <div className="flex justify-between items-center bg-slate-800 p-4">
            <h1 className="text-xl font-bold text-white flex items-center">
              <Calendar className="mr-2" /> Generador de Horarios
            </h1>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 transition-colors">
              <X className="text-white" />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="bg-slate-800 px-4 pb-4">
            <div className="flex items-center justify-between max-w-md mx-auto">
              <div className={`flex flex-col items-center ${mode === "approved" ? "text-violet-400" : "text-white"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${mode === "approved" ? "bg-violet-600" : "bg-slate-600"}`}
                >
                  1
                </div>
                <span className="text-xs mt-1">Aprobadas</span>
              </div>
              <div className="flex-1 h-1 bg-slate-700">
                <div
                  className={`h-full bg-violet-600 ${mode === "approved" ? "w-0" : "w-full"} transition-all duration-300`}
                ></div>
              </div>
              <div
                className={`flex flex-col items-center ${mode === "regular" ? "text-violet-400" : mode === "approved" ? "text-slate-400" : "text-white"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${mode === "regular" ? "bg-violet-600" : mode === "approved" ? "bg-slate-700" : "bg-slate-600"}`}
                >
                  2
                </div>
                <span className="text-xs mt-1">Regulares</span>
              </div>
              <div className="flex-1 h-1 bg-slate-700">
                <div
                  className={`h-full bg-violet-600 ${mode === "schedule" ? "w-full" : "w-0"} transition-all duration-300`}
                ></div>
              </div>
              <div
                className={`flex flex-col items-center ${mode === "schedule" ? "text-violet-400" : "text-slate-400"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${mode === "schedule" ? "bg-violet-600" : "bg-slate-700"}`}
                >
                  3
                </div>
                <span className="text-xs mt-1">Horario</span>
              </div>
            </div>
          </div>

          <div className="p-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="bg-slate-800 p-4 flex justify-between">
            <Button
              onClick={mode === "approved" ? onClose : handleBack}
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-slate-700 px-4"
            >
              {mode === "approved" ? "Cancelar" : "Atrás"}
            </Button>
            <Button
              onClick={handleContinue}
              className="bg-violet-600 hover:bg-violet-700 text-white flex items-center px-4"
              disabled={mode === "schedule" && !timeSlot}
            >
              {mode === "schedule" ? "Finalizar" : "Continuar"}
              {mode !== "schedule" && <ArrowRight className="ml-2" size={16} />}
            </Button>
          </div>

          <div className="bg-slate-800 p-4 border-t border-slate-700">
            <p className="text-center text-slate-300">
              Hecho por{" "}
              <a
                href="https://www.linkedin.com/in/franprzdev/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-violet-400 hover:text-violet-300"
              >
                Francisco Perez
              </a>{" "}
              con ❤️
            </p>
          </div>
        </div>
      </div>

      {currentLevelModal !== null && (
        <LevelSelectionModal
          level={currentLevelModal}
          courses={coursesByLevel[currentLevelModal]}
          selectedCourses={
            modalType === "regular"
              ? selectedRegular.filter((code) => {
                  const course = coursesData.find((c) => c.code === code)
                  return course?.level === currentLevelModal
                })
              : selectedApproved.filter((code) => {
                  const course = coursesData.find((c) => c.code === code)
                  return course?.level === currentLevelModal
                })
          }
          onSelect={handleLevelSelection}
          onClose={() => setCurrentLevelModal(null)}
          modalType={modalType}
          approvedCourses={selectedApproved}
        />
      )}
    </div>
  )
}
