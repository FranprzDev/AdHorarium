"use client"

import { useState, type FormEvent } from "react"
import { MailCheck, Send } from "lucide-react"
import { requestPasswordResetAction } from "@/app/actions/password-reset"
import { FormError } from "@/components/auth/form-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PASSWORD_RESET_REQUESTED_MESSAGE, PASSWORD_RESET_TTL_MINUTES } from "@/lib/auth/password-reset-config"
import { passwordResetRequestSchema } from "@/lib/validation/auth"

const UNEXPECTED_MESSAGE = "No pudimos procesar el pedido. Probá de nuevo en unos minutos."

export function PasswordResetRequestForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = passwordResetRequestSchema.safeParse({ email })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? UNEXPECTED_MESSAGE)
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await requestPasswordResetAction(parsed.data)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setIsSent(true)
    } catch {
      setError(UNEXPECTED_MESSAGE)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSent) {
    return (
      <div role="status" className="space-y-3 rounded-md border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
        <p className="flex items-start gap-2 font-medium">
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" />
          {PASSWORD_RESET_REQUESTED_MESSAGE}
        </p>
        <p className="text-muted-foreground">El enlace vale por {PASSWORD_RESET_TTL_MINUTES} minutos y se puede usar una sola vez.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>
      <FormError message={error} />
      <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
        <Send className="h-4 w-4" />
        {isSubmitting ? "Enviando..." : "Enviar instrucciones"}
      </Button>
    </form>
  )
}
