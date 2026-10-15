import type React from "react"
import { PublicHeader } from "@/components/layout/public-header"
import CareersHeader from "./_components/CareersHeader"

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 md:px-8 md:py-8">
        <CareersHeader />
        {children}
      </main>
    </div>
  )
}
