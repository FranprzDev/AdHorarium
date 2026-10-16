import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

function DeniedAccess() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="surface-card flex max-w-md flex-col items-center gap-4 p-8 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h2 className="font-serif text-2xl font-semibold text-foreground">Acceso Requerido</h2>
        <p className="text-muted-foreground">Necesitás iniciar sesión para acceder al gestor de materias.</p>
        <Button asChild className="mt-2">
          <Link href="/">Ir al Inicio</Link>
        </Button>
      </div>
    </div>
  )
}

export default DeniedAccess
