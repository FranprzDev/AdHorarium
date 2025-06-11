"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"

export const HoverEffect = ({
  items,
  className,
}: {
  items: {
    id: string
    title: string
    description: string
    correlatives: number
    link?: string
    onClick?: () => void
    isSelected?: boolean
    isCorrelative?: boolean
    isPrerequisite?: boolean
    isHigherDependency?: boolean
    isElective?: boolean
  }[]
  className?: string
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className={cn("grid grid-cols-1 py-10", className)}>
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="relative group block p-2 h-full w-full"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={item.onClick}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-violet-100 dark:bg-violet-900/50 block rounded-lg"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.2 },
                }}
              />
            )}
          </AnimatePresence>
          <Card
            isSelected={item.isSelected}
            isCorrelative={item.isCorrelative}
            isPrerequisite={item.isPrerequisite}
            isHigherDependency={item.isHigherDependency}
            isElective={item.isElective}
          >
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>
              <div className="flex items-center justify-between">
                <span>{item.description} horas semanales</span>
                {item.correlatives > 0 && (
                  <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900/50 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:text-orange-300">
                    {item.correlatives} correlativa{item.correlatives !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </CardDescription>
          </Card>
        </div>
      ))}
    </div>
  )
}

export const Card = ({
  className,
  children,
  isSelected,
  isCorrelative,
  isPrerequisite,
  isHigherDependency,
  isElective,
}: {
  className?: string
  children: React.ReactNode
  isSelected?: boolean
  isCorrelative?: boolean
  isPrerequisite?: boolean
  isHigherDependency?: boolean
  isElective?: boolean
}) => {
  return (
    <div
      className={cn(
        "rounded-lg h-full w-full p-4 overflow-hidden bg-white dark:bg-black border border-transparent dark:border-white/[0.2] group-hover:border-violet-500 relative z-20",
        isSelected && "border-violet-600 dark:border-violet-400 shadow-lg ring-2 ring-violet-500",
        isCorrelative && "border-orange-400 dark:border-orange-600 shadow-md bg-orange-50 dark:bg-orange-900/30",
        isPrerequisite && "bg-green-50 dark:bg-green-900/30",
        isHigherDependency && "bg-red-50 dark:bg-red-900/30",
        isElective && "bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700",
        className,
      )}
    >
      <div className="relative z-50">
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export const CardTitle = ({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) => {
  return <h4 className={cn("text-zinc-700 dark:text-zinc-300 font-bold tracking-wide mt-4", className)}>{children}</h4>
}

export const CardDescription = ({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) => {
  return (
    <div className={cn("mt-2 text-zinc-600 dark:text-zinc-400 tracking-wide leading-relaxed text-sm", className)}>
      {children}
    </div>
  )
}
