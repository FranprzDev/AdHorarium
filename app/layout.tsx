import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthManager } from "@/components/auth/AuthManager"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UTN FRT - Herramientas para Estudiantes",
  description: "Herramientas para estudiantes de ingeniería de la UTN FRT",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthManager>{children}</AuthManager>
      </body>
    </html>
  )
}
