"use client"

import type React from "react"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { ThemeMode } from "@/types/enums"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme={ThemeMode.Light} enableSystem={false} disableTransitionOnChange>
        {children}
        <Toaster position="bottom-center" richColors closeButton />
      </ThemeProvider>
    </SessionProvider>
  )
}
