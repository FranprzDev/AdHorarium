import type React from "react"
import { PublicHeader } from "@/components/layout/public-header"

type AuthCardProps = {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
  footer: React.ReactNode
}

/** Shared frame of the sign in and registration pages. */
export function AuthCard({ eyebrow, title, description, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="relative overflow-hidden">
        <div className="grid-paper pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="relative mx-auto flex max-w-md flex-col px-4 py-12 md:py-20">
          <div className="surface-card p-6 sm:p-8">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            <div className="mt-6">{children}</div>
          </div>
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </div>
      </main>
    </div>
  )
}
