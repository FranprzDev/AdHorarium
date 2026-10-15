"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeMode } from "@/types/enums"

interface ThemeToggleProps {
  className?: string
}

/** Switches between the light and dark brand themes. Renders a placeholder until mounted to avoid hydration mismatches. */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const isDark = isMounted && resolvedTheme === ThemeMode.Dark
  const label = isDark ? "Usar tema claro" : "Usar tema oscuro"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? ThemeMode.Light : ThemeMode.Dark)}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
