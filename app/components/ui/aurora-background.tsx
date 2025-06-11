"use client"

import { cn } from "@/lib/utils"
import type React from "react"
import { useEffect, useRef, useState } from "react"

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: React.ReactNode
  showRadialGradient?: boolean
  className?: string
}

export const AuroraBackground = ({
  children,
  showRadialGradient = true,
  className,
  ...props
}: AuroraBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setCursorPosition({ x, y })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-violet-800",
        className,
      )}
      {...props}
    >
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(
              circle at ${cursorPosition.x}px ${cursorPosition.y}px,
              rgba(124, 58, 237, 0.15),
              rgba(124, 58, 237, 0) 25%
            ),
            radial-gradient(
              circle at ${cursorPosition.x - 200}px ${cursorPosition.y + 200}px,
              rgba(14, 165, 233, 0.1),
              rgba(14, 165, 233, 0) 25%
            ),
            radial-gradient(
              circle at ${cursorPosition.x + 200}px ${cursorPosition.y - 200}px,
              rgba(79, 70, 229, 0.1),
              rgba(79, 70, 229, 0) 25%
            )
          `,
        }}
      />
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(to bottom right, rgba(124, 58, 237, 0.05), rgba(14, 165, 233, 0.05))",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
