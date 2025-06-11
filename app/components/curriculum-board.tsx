"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Course } from "@/types/course"
import { Badge, Button } from "@/app/components/ui/acernity-ui"
import CourseCard from "@/app/components/course-card"
import { Eye } from "lucide-react"

interface CurriculumBoardProps {
  plan: "2008" | "2023"
  filterType: "regulares" | "aprobadas"
  filterPurpose: "cursar" | "rendir"
  coursesData: Course[]
  hideElectives: boolean
}

export default function CurriculumBoard({
  plan,
  filterType,
  filterPurpose,
  coursesData,
  hideElectives,
}: CurriculumBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [relatedCourses, setRelatedCourses] = useState<string[]>([])
  const [prerequisites, setPrerequisites] = useState<string[]>([])
  const [higherLevelDependencies, setHigherLevelDependencies] = useState<string[]>([])

  // Filter out electives if needed
  const filteredCoursesData = useMemo(() => {
    return hideElectives ? coursesData.filter((course) => !course.isElective) : coursesData
  }, [coursesData, hideElectives])

  // Get correlatives based on filter settings - memoized to prevent infinite loop
  const getCorrelatives = useCallback(
    (course: Course): string[] => {
      return filterPurpose === "cursar"
        ? filterType === "regulares"
          ? course.regularesParaCursar
          : course.aprobadasParaCursar
        : course.aprobadasParaRendir
    },
    [filterType, filterPurpose],
  )

  // Group courses by level (year)
  const coursesByLevel = useMemo(() => {
    const result: Record<number, Course[]> = {}

    filteredCoursesData.forEach((course) => {
      const level = course.level
      if (!result[level]) {
        result[level] = []
      }
      result[level].push(course)
    })

    // Sort courses within each level - correlatives first for levels > 1
    Object.keys(result).forEach((level) => {
      const numLevel = Number(level)
      if (numLevel > 1) {
        result[numLevel].sort((a, b) => {
          const aCorrelatives = getCorrelatives(a).length
          const bCorrelatives = getCorrelatives(b).length
          return bCorrelatives - aCorrelatives
        })
      }
    })

    return result
  }, [filteredCoursesData, getCorrelatives])

  // Get sorted levels
  const levels = useMemo(() => {
    return Object.keys(coursesByLevel)
      .map(Number)
      .sort((a, b) => a - b)
  }, [coursesByLevel])

  // Find all related courses (path before and after)
  useEffect(() => {
    if (!selectedCourse) {
      setRelatedCourses([])
      setPrerequisites([])
      setHigherLevelDependencies([])
      return
    }

    const related = new Set<string>()
    const prereqs = new Set<string>()
    const higherDeps = new Set<string>()

    // Find the selected course
    const course = filteredCoursesData.find((c) => c.code === selectedCourse)
    if (!course) return

    // Add direct correlatives (path before)
    const correlatives = getCorrelatives(course)
    correlatives.forEach((code) => {
      const prereqCourse = filteredCoursesData.find((c) => c.code === code)
      if (prereqCourse && prereqCourse.level <= course.level) {
        related.add(code)
        prereqs.add(code)
      }
    })

    // Find courses that have this course as correlative (path after)
    filteredCoursesData.forEach((c) => {
      const courseCorrelatives = getCorrelatives(c)
      if (courseCorrelatives.includes(selectedCourse)) {
        if (c.level > course.level) {
          higherDeps.add(c.code)
        }
        related.add(c.code)
      }
    })

    setRelatedCourses(Array.from(related))
    setPrerequisites(Array.from(prereqs))
    setHigherLevelDependencies(Array.from(higherDeps))
  }, [selectedCourse, filteredCoursesData, getCorrelatives])

  const handleCardClick = useCallback((code: string) => {
    setSelectedCourse((prev) => (prev === code ? null : code))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedCourse(null)
  }, [])

  // Determine if a course should be visible when a course is selected
  const isCourseVisible = useCallback(
    (course: Course) => {
      if (!selectedCourse) return true
      return course.code === selectedCourse || relatedCourses.includes(course.code)
    },
    [selectedCourse, relatedCourses],
  )

  return (
    <div className="relative w-full overflow-x-hidden" ref={boardRef}>
      {/* Clear selection button */}
      {selectedCourse && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button onClick={clearSelection} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 px-4">
            <Eye size={16} />
            <span>Ver todo el plan</span>
          </Button>
        </div>
      )}

      {/* Kanban board */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 p-8">
        {levels.map((level) => (
          <div key={level} className="flex flex-col gap-6">
            <div className="sticky top-0 z-10 flex items-center justify-center bg-white/10 dark:bg-black/20 backdrop-blur-sm p-3 rounded-lg shadow-sm">
              <Badge color="primary" className="text-lg px-6 py-2">
                Nivel {level}
              </Badge>
            </div>
            <AnimatePresence>
              <div className="flex flex-col gap-4">
                {coursesByLevel[level]
                  .filter((course) => isCourseVisible(course))
                  .map((course) => (
                    <motion.div
                      key={course.code}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CourseCard
                        course={course}
                        onClick={() => handleCardClick(course.code)}
                        isSelected={course.code === selectedCourse}
                        isCorrelative={relatedCourses.includes(course.code)}
                        isPrerequisite={prerequisites.includes(course.code)}
                        isHigherDependency={higherLevelDependencies.includes(course.code)}
                        isElective={course.isElective}
                      />
                    </motion.div>
                  ))}
              </div>
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}
