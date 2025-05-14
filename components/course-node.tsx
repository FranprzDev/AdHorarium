"use client"

import { useState } from "react"
import { gsap } from "gsap"
import type { Course } from "@/types/course"
import { coursesData2008 } from "@/data/courses-2008"
import { Tooltip } from "@/components/ui/acernity-ui"

interface CourseNodeProps {
  course: Course
  x: number
  y: number
  filterType: "regulares" | "aprobadas"
  filterPurpose: "cursar" | "rendir"
}

export default function CourseNode({ course, x, y, filterType, filterPurpose }: CourseNodeProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = () => {
    setIsHovered(true)
    gsap.to(`#node-${course.code}`, {
      scale: 1.1,
      duration: 0.3,
      ease: "power2.out",
    })
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    gsap.to(`#node-${course.code}`, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out",
    })
  }

  // Determine correlatives based on filter
  const correlatives =
    filterPurpose === "cursar"
      ? filterType === "regulares"
        ? course.regularesParaCursar
        : course.aprobadasParaCursar
      : course.aprobadasParaRendir

  // Determine node color based on number of correlatives
  const getNodeColor = () => {
    if (correlatives.length === 0) return "#4ade80" // Green for no correlatives
    if (correlatives.length <= 2) return "#facc15" // Yellow for few correlatives
    return "#f87171" // Red for many correlatives
  }

  const nodeColor = getNodeColor()
  const nodeRadius = 50 // Increased radius for circular nodes

  return (
    <g
      id={`node-${course.code}`}
      transform={`translate(${x}, ${y})`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="course-node cursor-pointer"
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <Tooltip
        content={
          <div className="p-2 max-w-xs">
            <p className="font-bold">{course.name}</p>
            <p className="text-sm">Código: {course.code}</p>
            <div className="mt-2">
              <p className="text-xs font-semibold">Correlativas para {filterPurpose}:</p>
              {correlatives.length > 0 ? (
                <ul className="text-xs list-disc pl-4 mt-1">
                  {correlatives.map((code) => (
                    <li key={code}>
                      {code} - {coursesData2008.find((c) => c.code === code)?.name || code}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs italic mt-1">No tiene correlativas</p>
              )}
            </div>
          </div>
        }
      >
        {/* Circular background */}
        <circle r={nodeRadius} fill={nodeColor} stroke="#334155" strokeWidth={2} opacity={0.9} />

        {/* Course code at the top */}
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#334155"
          fontWeight="bold"
          fontSize="14"
          dy={-nodeRadius / 2 + 10}
        >
          {course.code}
        </text>

        {/* Course name in the center, wrapped if necessary */}
        <foreignObject x={-nodeRadius + 10} y={-nodeRadius / 4} width={nodeRadius * 2 - 20} height={nodeRadius}>
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            className="w-full h-full flex items-center justify-center text-center"
          >
            <p className="text-xs font-medium text-slate-800 leading-tight">{course.name}</p>
          </div>
        </foreignObject>
      </Tooltip>
    </g>
  )
}
