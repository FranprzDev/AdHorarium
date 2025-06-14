"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { coursesData2008 } from "@/data/courses-2008"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Course } from "@/types/course"

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

  const isAllCoursesSelected = (level: number) => {
    const levelCourses = coursesByLevel[level]
    const selectedLevelCourses = selectedCourses[level] || []
    return levelCourses.length === selectedLevelCourses.length && levelCourses.length > 0
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
    <AuroraBackground className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-6">Gestor de Horarios</h1>
        <p className="text-purple-200 mb-8">Selecciona las materias que deseas incluir en tu horario de cursado.</p>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          {levels.map((level) => {
            const regularCourses = coursesByLevel[level].filter((course) => !course.isElective)
            const electiveCourses = coursesByLevel[level].filter((course) => course.isElective)

            return (
              <motion.div key={level} variants={itemVariants} className="glass-card p-6">
                <div className="flex flex-wrap justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-purple-700 text-white px-3 py-1">Nivel {level}</Badge>
                    {getSelectedCoursesCount(level) > 0 && (
                      <span className="text-sm text-purple-200">
                        ({getSelectedCoursesCount(level)} de {coursesByLevel[level].length} seleccionadas)
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectAllCoursesInLevel(level)}
                      className="text-xs bg-transparent border-purple-500/30 text-white hover:bg-purple-800/30"
                    >
                      Seleccionar todas
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deselectAllCoursesInLevel(level)}
                      className="text-xs bg-transparent border-purple-500/30 text-white hover:bg-purple-800/30"
                    >
                      Deseleccionar todas
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {regularCourses.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Materias Obligatorias</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {regularCourses.map((course) => (
                          <Card
                            key={course.code}
                            className="bg-white/5 border-purple-500/20 hover:bg-white/10 transition-colors"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  id={`course-${course.code}`}
                                  checked={(selectedCourses[level] || []).includes(course.code)}
                                  onCheckedChange={() => toggleCourseSelection(level, course.code)}
                                  className="mt-1 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                />
                                <div>
                                  <label
                                    htmlFor={`course-${course.code}`}
                                    className="text-white font-medium cursor-pointer"
                                  >
                                    {course.name}
                                  </label>
                                  <p className="text-xs text-purple-200 mt-1">{course.hours} horas semanales</p>
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
                      <h3 className="text-lg font-medium text-white mb-4">Materias Electivas</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {electiveCourses.map((course) => (
                          <Card
                            key={course.code}
                            className="bg-purple-900/20 border-purple-500/20 hover:bg-purple-900/30 transition-colors"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  id={`course-${course.code}`}
                                  checked={(selectedCourses[level] || []).includes(course.code)}
                                  onCheckedChange={() => toggleCourseSelection(level, course.code)}
                                  className="mt-1 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                />
                                <div>
                                  <label
                                    htmlFor={`course-${course.code}`}
                                    className="text-white font-medium cursor-pointer"
                                  >
                                    {course.name}
                                  </label>
                                  <p className="text-xs text-purple-200 mt-1">{course.hours} horas semanales</p>
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

        <div className="mt-8 flex justify-end">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">Generar Horario</Button>
        </div>
      </motion.div>
    </AuroraBackground>
  )
}
