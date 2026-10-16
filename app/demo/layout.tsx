import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Demo del plan de correlativas",
  description: "Probá el plan de correlativas de Ingeniería en Sistemas de Información con filtros por cursado y examen.",
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
