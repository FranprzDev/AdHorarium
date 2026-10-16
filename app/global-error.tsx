"use client"

import Link from "next/link"
import { useEffect } from "react"
import "./globals.css"

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Last-resort fallback when the root layout itself fails. It replaces the whole document, so it renders its own
 * <html>/<body> and avoids the providers and components the failing layout may depend on.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[global-error]", { digest: error.digest ?? null, name: error.name, message: error.message })
  }, [error])

  return (
    <html lang="es">
      <body className="font-sans">
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
          <div className="surface-card flex max-w-lg flex-col items-center gap-4 p-8 text-center md:p-10" role="alert">
            <h1 className="font-serif text-3xl font-semibold text-foreground">Algo salió mal</h1>
            <p className="text-muted-foreground">No pudimos cargar AdHorarium. Probá de nuevo en unos segundos.</p>
            {error.digest && <p className="text-xs text-muted-foreground">Código de referencia: {error.digest}</p>}
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={reset}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Reintentar
              </button>
              <Link href="/" className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
                Ir al inicio
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
