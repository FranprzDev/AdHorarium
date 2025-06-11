import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthInitializer } from "@/components/auth-initializer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UTN FRT - Herramientas para Estudiantes",
  description: "Herramientas para estudiantes de ingeniería de la UTN FRT",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthInitializer>{children}</AuthInitializer>
      </body>
    </html>
  )
}
