"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { coursesData2008 } from "@/data/courses-2008"
import { PageHeader } from "@/components/brand/page-header"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import type { Course } from "@/types/types"

export default function HorariosPage() {
  const [selectedCourses, setSelectedCourses] = useState<Record<number, string[]>>({})
  const coursesData = coursesData2008

  const coursesByLevel = coursesData.reduce(
    (acc, course) => {
      const level = course.level
      if (!acc[level]) {
        acc[level] = []
      }
      acc[level].push(course)
      return acc
    },
    {} as Record<number, Course[]>,
  )
  const levels = Object.keys(coursesByLevel)
    .map(Number)
    .sort((a, b) => a - b)

  const toggleCourseSelection = (level: number, courseCode: string) => {
    setSelectedCourses((prev) => {
      const levelCourses = prev[level] || []
      const updatedLevelCourses = levelCourses.includes(courseCode)
        ? levelCourses.filter((code) => code !== courseCode)
        : [...levelCourses, courseCode]

      return {
        ...prev,
        [level]: updatedLevelCourses,
      }
    })
  }

  const selectAllCoursesInLevel = (level: number) => {
    const allCourseCodes = coursesByLevel[level].map((course) => course.code)
    setSelectedCourses((prev) => ({
      ...prev,
      [level]: allCourseCodes,
    }))
  }

  const deselectAllCoursesInLevel = (level: number) => {
    setSelectedCourses((prev) => ({
      ...prev,
      [level]: [],
    }))
  }

  const getSelectedCoursesCount = (level: number) => {
    return (selectedCourses[level] || []).length
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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <PageHeader
          eyebrow="Prototipo en desarrollo"
          title="Gestor de Horarios"
          description="Selecciona las materias que deseas incluir en tu horario de cursado."
        />

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          {levels.map((level) => {
            const regularCourses = coursesByLevel[level].filter((course) => !course.isElective)
            const electiveCourses = coursesByLevel[level].filter((course) => course.isElective)

            return (
              <motion.div key={level} variants={itemVariants} className="surface-card p-4 md:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="font-serif text-xl font-semibold text-foreground">Nivel {level}</h2>
                    {getSelectedCoursesCount(level) > 0 && (
                      <span className="text-sm text-muted-foreground">
                        ({getSelectedCoursesCount(level)} de {coursesByLevel[level].length} seleccionadas)
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectAllCoursesInLevel(level)}
                      className="bg-card text-xs"
                    >
                      Seleccionar todas
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deselectAllCoursesInLevel(level)}
                      className="bg-card text-xs"
                    >
                      Deseleccionar todas
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {regularCourses.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Materias Obligatorias</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {regularCourses.map((course) => (
                          <Card
                            key={course.code}
                            className="bg-background shadow-none transition-colors hover:border-primary/40"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  id={`course-${course.code}`}
                                  checked={(selectedCourses[level] || []).includes(course.code)}
                                  onCheckedChange={() => toggleCourseSelection(level, course.code)}
                                  className="mt-1"
                                />
                                <div>
                                  <label
                                    htmlFor={`course-${course.code}`}
                                    className="cursor-pointer text-sm font-medium leading-snug text-foreground"
                                  >
                                    {course.name}
                                  </label>
                                  <p className="mt-1 text-xs text-muted-foreground">{course.hours} horas semanales</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {electiveCourses.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Materias Electivas</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {electiveCourses.map((course) => (
                          <Card
                            key={course.code}
                            className="border-dashed bg-background shadow-none transition-colors hover:border-primary/40"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  id={`course-${course.code}`}
                                  checked={(selectedCourses[level] || []).includes(course.code)}
                                  onCheckedChange={() => toggleCourseSelection(level, course.code)}
                                  className="mt-1"
                                />
                                <div>
                                  <label
                                    htmlFor={`course-${course.code}`}
                                    className="cursor-pointer text-sm font-medium leading-snug text-foreground"
                                  >
                                    {course.name}
                                  </label>
                                  <p className="mt-1 text-xs text-muted-foreground">{course.hours} horas semanales</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        <div className="flex justify-end">
          <Button disabled title="Esta versión todavía no arma horarios">Generar Horario</Button>
        </div>
      </motion.div>
  )
}
