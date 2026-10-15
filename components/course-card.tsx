"use client"

import type { Course } from "@/types/types"
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
  return (
    <div
      className={cn(
        "cursor-pointer rounded-lg border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md",
        isElective && "border-dashed",
        isCorrelative && "border-amber-500/60 bg-amber-50 dark:bg-amber-400/10",
        isPrerequisite && "border-emerald-600/50 bg-emerald-50 dark:bg-emerald-400/10",
        isHigherDependency && "border-rose-500/50 bg-rose-50 dark:bg-rose-400/10",
        isSelected && "border-primary bg-secondary ring-2 ring-primary/20",
      )}
      onClick={onClick}
      data-course-code={course.code}
    >
      <h4 className="mb-2 font-semibold leading-snug text-foreground">{course.name}</h4>
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{course.hours} horas semanales</span>
        {(course.regularesParaCursar.length > 0 ||
          course.aprobadasParaCursar.length > 0 ||
          course.aprobadasParaRendir.length > 0) && (
          <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground/80">
            {course.regularesParaCursar.length + course.aprobadasParaCursar.length} correlativas
          </span>
        )}
      </div>
    </div>
  )
}
