import Link from "next/link"
import { Compass } from "lucide-react"
import { PublicHeader } from "@/components/layout/public-header"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Página no encontrada",
}

/** Branded 404 for any unknown route; Next answers it with status 404. */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="flex items-center justify-center px-4 py-16 md:py-24">
        <div className="surface-card flex max-w-lg flex-col items-center gap-4 p-8 text-center md:p-10">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Compass className="h-7 w-7 text-primary" aria-hidden="true" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Error 404</p>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Página no encontrada</h1>
          <p className="text-muted-foreground">
            La dirección que abriste no existe o cambió. Revisá el enlace o volvé al inicio para seguir planificando.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/">Ir al inicio</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/careers">Ver planes de estudio</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
