"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, MailCheck } from "lucide-react"
import { confirmEmailAction } from "@/app/actions/email-verification"
import { FormError } from "@/components/auth/form-error"
import { Button } from "@/components/ui/button"

const UNEXPECTED_MESSAGE = "No pudimos confirmar tu email. Probá de nuevo en unos minutos."

export function ConfirmEmailForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await confirmEmailAction(token)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setIsDone(true)
    } catch {
      setError(UNEXPECTED_MESSAGE)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isDone) {
    return (
      <div className="space-y-4">
        <p role="status" className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-4 text-sm font-medium text-foreground">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" />
          Listo, confirmaste tu email.
        </p>
        <Button asChild className="h-11 w-full">
          <Link href="/dashboard">Ir a mi panel</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <FormError message={error} />
      <Button type="button" className="h-11 w-full" disabled={isSubmitting} onClick={() => void handleConfirm()}>
        <MailCheck className="h-4 w-4" />
        {isSubmitting ? "Confirmando..." : "Confirmar mi email"}
      </Button>
    </div>
  )
}
