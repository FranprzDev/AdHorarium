import { Loader2 } from "lucide-react"

function LoadingSubjects() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span>Cargando materias...</span>
      </div>
    </div>
  )
}

export default LoadingSubjects
