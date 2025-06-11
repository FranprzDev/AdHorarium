"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence } from "framer-motion"
import type { Course } from "@/types/course"
import { Badge } from "@/app/components/ui/acernity-ui"
import { HoverEffect } from "@/app/components/ui/card-hover-effect"
import { Button } from "@/app/components/ui/acernity-ui"
import { X } from "lucide-react"

interface CourseBoardProps {
  plan: "2008" | "2023"
  filterType: "regulares" | "aprobadas"
  filterPurpose: "cursar" | "rendir"
  coursesData: Course[]
}

export default function CourseBoard({ plan, filterType, filterPurpose, coursesData }: CourseBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [relatedCourses, setRelatedCourses] = useState<string[]>([])

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

  Object.keys(coursesByLevel).forEach((level) => {
    const numLevel = Number(level)
    if (numLevel > 1) {
      coursesByLevel[numLevel].sort((a, b) => {
        const aCorrelatives = getCorrelatives(a).length
        const bCorrelatives = getCorrelatives(b).length
        return bCorrelatives - aCorrelatives // Courses with correlatives first
      })
    }
  })

  const levels = Object.keys(coursesByLevel)
    .map(Number)
    .sort((a, b) => a - b)

  // Store card positions for drawing connections
  const cardPositions = new Map<string, DOMRect>()

  // Get correlatives based on filter settings
  function getCorrelatives(course: Course): string[] {
    return filterPurpose === "cursar"
      ? filterType === "regulares"
        ? course.regularesParaCursar
        : course.aprobadasParaCursar
      : course.aprobadasParaRendir
  }

  // Find all related courses (path before and after)
  useEffect(() => {
    if (!selectedCourse) {
      setRelatedCourses([])
      return
    }

    const related = new Set<string>()

    // Find the selected course
    const course = coursesData.find((c) => c.code === selectedCourse)
    if (!course) return

    // Add direct correlatives (path before)
    const correlatives = getCorrelatives(course)
    correlatives.forEach((code) => related.add(code))

    // Find courses that have this course as correlative (path after)
    coursesData.forEach((c) => {
      const courseCorrelatives = getCorrelatives(c)
      if (courseCorrelatives.includes(selectedCourse)) {
        related.add(c.code)
      }
    })

    setRelatedCourses(Array.from(related))
  }, [selectedCourse, coursesData, filterType, filterPurpose])

  useEffect(() => {
    // Update card positions after render
    const updateCardPositions = () => {
      const cards = document.querySelectorAll<HTMLDivElement>("[data-course-code]")
      cards.forEach((card) => {
        const code = card.dataset.courseCode
        if (code) {
          cardPositions.set(code, card.getBoundingClientRect())
        }
      })
      drawConnections()
    }

    // Draw connections between cards
    const drawConnections = () => {
      if (!svgRef.current || !boardRef.current) return

      const boardRect = boardRef.current.getBoundingClientRect()
      const connections: Array<{ start: DOMRect; end: DOMRect; id: string; highlight: boolean }> = []

      coursesData.forEach((course) => {
        const targetCard = cardPositions.get(course.code)
        if (!targetCard) return

        const correlatives = getCorrelatives(course)

        correlatives.forEach((sourceCode) => {
          const sourceCard = cardPositions.get(sourceCode)
          if (sourceCard) {
            // Highlight if selected course or related to selected course
            const highlight =
              selectedCourse === course.code ||
              selectedCourse === sourceCode ||
              (selectedCourse && relatedCourses.includes(course.code) && relatedCourses.includes(sourceCode))

            connections.push({
              start: sourceCard,
              end: targetCard,
              id: `${sourceCode}-${course.code}`,
              highlight,
            })
          }
        })
      })

      // Update SVG size
      svgRef.current.setAttribute("width", boardRect.width.toString())
      svgRef.current.setAttribute("height", boardRect.height.toString())

      // Create paths for connections
      const pathsContainer = svgRef.current.querySelector(".connections")
      if (pathsContainer) {
        pathsContainer.innerHTML = connections
          .map(({ start, end, id, highlight }) => {
            const startX = start.left - boardRect.left + start.width / 2
            const startY = start.top - boardRect.top + start.height / 2
            const endX = end.left - boardRect.left + end.width / 2
            const endY = end.top - boardRect.top + end.height / 2
            const controlPoint = (endX - startX) * 0.5

            return `
              <path
                key="${id}"
                d="M ${startX} ${startY} 
                   C ${startX + controlPoint} ${startY} 
                     ${endX - controlPoint} ${endY} 
                     ${endX} ${endY}"
                stroke="${highlight ? "#7c3aed" : "#e2e8f0"}"
                strokeWidth="${highlight ? "3" : "1.5"}"
                fill="none"
                opacity="${highlight ? "0.9" : "0.2"}"
                markerEnd="url(#${highlight ? "arrowhead-highlight" : "arrowhead"})"
                class="transition-all duration-300"
              />
            `
          })
          .join("")
      }
    }

    // Initial update and window resize handler
    setTimeout(updateCardPositions, 500) // Delay to ensure cards are rendered
    window.addEventListener("resize", updateCardPositions)

    return () => {
      window.removeEventListener("resize", updateCardPositions)
    }
  }, [coursesData, selectedCourse, relatedCourses, cardPositions])

  const handleCardClick = (code: string) => {
    setSelectedCourse(code === selectedCourse ? null : code)
  }

  const clearSelection = () => {
    setSelectedCourse(null)
  }

  return (
    <div className="relative w-full overflow-x-hidden" ref={boardRef}>
      {/* SVG layer for connections */}
      <svg
        ref={svgRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ minHeight: "800px" }}
      >
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#e2e8f0" />
          </marker>
          <marker id="arrowhead-highlight" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#7c3aed" />
          </marker>
        </defs>
        <g className="connections" />
      </svg>

      {/* Clear selection button */}
      {selectedCourse && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button onClick={clearSelection} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700">
            <X size={16} />
            <span>Limpiar selección</span>
          </Button>
        </div>
      )}

      {/* Kanban board */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 p-8">
        {levels.map((level) => (
          <div key={level} className="flex flex-col gap-6">
            <div className="sticky top-0 z-10 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm p-3 rounded-lg shadow-sm">
              <Badge color="primary" className="text-lg px-6 py-2">
                Nivel {level}
              </Badge>
            </div>
            <AnimatePresence>
              <div className="flex flex-col gap-6">
                <HoverEffect
                  items={coursesByLevel[level].map((course) => ({
                    id: course.code,
                    title: course.name,
                    description: `${course.hours} horas semanales
                      ${
                        getCorrelatives(course).length > 0
                          ? `\n${getCorrelatives(course).length} correlativa${getCorrelatives(course).length !== 1 ? "s" : ""}`
                          : ""
                      }`,
                    onClick: () => handleCardClick(course.code),
                    isSelected: course.code === selectedCourse,
                    isCorrelative: relatedCourses.includes(course.code),
                  }))}
                  className="grid-cols-1 gap-4"
                />
                {coursesByLevel[level].map((course) => (
                  <div
                    key={course.code}
                    data-course-code={course.code}
                    className="hidden" // Hidden element just for position reference
                  />
                ))}
              </div>
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}
