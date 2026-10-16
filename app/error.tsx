"use client"

import Link from "next/link"
import { useEffect } from "react"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/** Branded fallback for unexpected render errors; offers a retry of the failed segment. */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // The server already logged the full error under this digest (instrumentation.ts); the browser console gets the reference.
    console.error("[error-boundary]", { digest: error.digest ?? null, name: error.name, message: error.message })
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="surface-card flex max-w-lg flex-col items-center gap-4 p-8 text-center md:p-10" role="alert">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <TriangleAlert className="h-7 w-7 text-destructive" aria-hidden="true" />
        </span>
        <h1 className="font-serif text-3xl font-semibold text-foreground">Algo salió mal</h1>
        <p className="text-muted-foreground">
          Tuvimos un problema al mostrar esta página. Probá de nuevo; si sigue pasando, volvé al inicio.
        </p>
        {error.digest && <p className="text-xs text-muted-foreground">Código de referencia: {error.digest}</p>}
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Reintentar</Button>
          <Button asChild variant="outline">
            <Link href="/">Ir al inicio</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
