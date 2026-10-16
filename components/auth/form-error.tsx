import { AlertCircle } from "lucide-react"

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </p>
  )
}
