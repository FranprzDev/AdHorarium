"use client"

import { useState } from "react"
import type { Course } from "@/types/course"
import { cn } from "@/lib/utils"

interface CourseCardProps {
  course: Course
  onClick?: () => void
  isSelected?: boolean
  isCorrelative?: boolean
  isPrerequisite?: boolean
  isHigherDependency?: boolean
  isElective?: boolean
}

export default function CourseCard({
  course,
  onClick,
  isSelected,
  isCorrelative,
  isPrerequisite,
  isHigherDependency,
  isElective,
}: CourseCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        "rounded-lg p-4 border border-transparent transition-all duration-200 cursor-pointer",
        "bg-white dark:bg-black shadow-sm hover:shadow-md",
        isHovered && "border-violet-400 dark:border-violet-600",
        isSelected && "bg-violet-100 dark:bg-violet-900/40 shadow-lg",
        isCorrelative && "border-orange-400 dark:border-orange-600 shadow-md bg-orange-50 dark:bg-orange-900/30",
        isPrerequisite && "bg-green-50 dark:bg-green-900/30",
        isHigherDependency && "bg-red-50 dark:bg-red-900/30",
        isElective && "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700",
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-course-code={course.code}
    >
      <h4 className="font-bold text-zinc-700 dark:text-zinc-300 mb-2">{course.name}</h4>
      <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
        <span>{course.hours} horas semanales</span>
        {(course.regularesParaCursar.length > 0 ||
          course.aprobadasParaCursar.length > 0 ||
          course.aprobadasParaRendir.length > 0) && (
          <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900/50 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:text-orange-300">
            {course.regularesParaCursar.length + course.aprobadasParaCursar.length} correlativas
          </span>
        )}
      </div>
    </div>
  )
}
