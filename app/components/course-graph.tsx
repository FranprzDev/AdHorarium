"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Course } from "@/types/course"
import CourseNode from "@/app/components/course-node"
import { Badge } from "@/app/components/ui/acernity-ui"
import { gsap } from "gsap"
import { coursesData2008 } from "@/data/courses-2008"
import { coursesData2023 } from "@/data/courses-2023"

interface CourseGraphProps {
  plan: "2008" | "2023"
  filterType: "regulares" | "aprobadas"
  filterPurpose: "cursar" | "rendir"
}

export default function CourseGraph({ plan, filterType, filterPurpose }: CourseGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 1000, height: 2000 })
  const coursesData = plan === "2008" ? coursesData2008 : coursesData2023

  // Group courses by level (year)
  const coursesByLevel = coursesData.reduce(
    (acc, course) => {
      const level = course.level
      if (!acc[level]) {
        acc[level] = []
      }
      acc[level].push(course)
      return acc
    },
    {} as Record<number, typeof coursesData>,
  )

  const levels = Object.keys(coursesByLevel)
    .map(Number)
    .sort((a, b) => a - b)

  useEffect(() => {
    const updateDimensions = () => {
      const container = svgRef.current?.parentElement
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: Math.max(container.clientHeight, levels.length * 350), // Increased height for larger nodes
        })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)

    return () => {
      window.removeEventListener("resize", updateDimensions)
    }
  }, [levels.length])

  useEffect(() => {
    // Animate nodes when filter changes
    if (svgRef.current) {
      gsap.fromTo(
        ".course-node",
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          stagger: 0.03,
          ease: "back.out(1.7)",
        },
      )

      gsap.fromTo(
        ".course-edge",
        { strokeDashoffset: 1000, opacity: 0 },
        {
          strokeDashoffset: 0,
          opacity: 0.7,
          duration: 0.8,
          stagger: 0.02,
          ease: "power3.out",
          delay: 0.3,
        },
      )
    }
  }, [])

  // Calculate node positions with more spacing
  const nodePositions = new Map()

  levels.forEach((level, levelIndex) => {
    const coursesInLevel = coursesByLevel[level]
    const levelY = 180 + levelIndex * 350 // Increased vertical spacing

    coursesInLevel.forEach((course, courseIndex) => {
      const courseCount = coursesInLevel.length
      const spacing = dimensions.width / (courseCount + 1)
      const x = spacing * (courseIndex + 1)
      const y = levelY

      nodePositions.set(course.code, { x, y })
    })
  })

  // Generate edges based on correlatives
  const edges = []

  coursesData.forEach((course) => {
    const targetPosition = nodePositions.get(course.code)
    if (!targetPosition) return

    const correlatives =
      filterPurpose === "cursar"
        ? filterType === "regulares"
          ? course.regularesParaCursar
          : course.aprobadasParaCursar
        : course.aprobadasParaRendir

    correlatives.forEach((sourceCode) => {
      const sourcePosition = nodePositions.get(sourceCode)
      if (sourcePosition) {
        edges.push({
          id: `${sourceCode}-${course.code}`,
          source: sourcePosition,
          target: targetPosition,
          sourceCode,
          targetCode: course.code,
        })
      }
    })
  })

  return (
    <div className="w-full overflow-auto" style={{ height: "calc(100vh - 200px)" }}>
      <div className="flex justify-center mb-4">
        <div className="flex gap-4 flex-wrap justify-center">
          {levels.map((level) => (
            <Badge key={level} color="primary">
              Nivel {level}
            </Badge>
          ))}
        </div>
      </div>

      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="block mx-auto">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ff5757" />
          </marker>
        </defs>

        <g className="edges">
          {edges.map((edge) => (
            <path
              key={edge.id}
              d={`M${edge.source.x},${edge.source.y} C${edge.source.x},${(edge.source.y + edge.target.y) / 2} ${edge.target.x},${(edge.source.y + edge.target.y) / 2} ${edge.target.x},${edge.target.y}`}
              stroke="#ff5757"
              strokeWidth="2"
              fill="none"
              strokeDasharray="1000"
              strokeDashoffset="0"
              markerEnd="url(#arrowhead)"
              className="course-edge"
              opacity="0.7"
            />
          ))}
        </g>

        <g className="nodes">
          {coursesData.map((course) => {
            const position = nodePositions.get(course.code)
            if (!position) return null

            return (
              <CourseNode
                key={course.code}
                course={course}
                x={position.x}
                y={position.y}
                filterType={filterType}
                filterPurpose={filterPurpose}
              />
            )
          })}
        </g>
      </svg>
    </div>
  )
}
