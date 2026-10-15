import type React from "react"
import "./globals.css"
import type { Metadata, Viewport } from "next"
import { Inter, Source_Serif_4 } from "next/font/google"
import { Providers } from "./providers"

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" })
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif", display: "swap", weight: ["500", "600", "700"] })

const TITLE = "AdHorarium · Planificador académico UTN FRT"
const DESCRIPTION =
  "Planificador académico para estudiantes de ingeniería de la UTN Facultad Regional Tucumán: plan de correlativas, estado de materias, mesas de examen y promedio."

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: "%s · AdHorarium",
  },
  description: DESCRIPTION,
  applicationName: "AdHorarium",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "AdHorarium",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
}

export const viewport: Viewport = {
  themeColor: "#13294B",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${sans.variable} ${serif.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
