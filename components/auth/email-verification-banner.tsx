"use client"

import { useEffect, useState } from "react"
import { MailWarning } from "lucide-react"
import { toast } from "sonner"
import { getEmailVerificationStatusAction, resendEmailVerificationAction, type EmailVerificationStatus } from "@/app/actions/email-verification"
import { Button } from "@/components/ui/button"

const UNEXPECTED_MESSAGE = "No pudimos reenviar el email. Probá de nuevo en unos minutos."

export function EmailVerificationBanner() {
  const [status, setStatus] = useState<EmailVerificationStatus | null>(null)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      const result = await getEmailVerificationStatusAction()
      if (active && result.ok) setStatus(result.data)
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  if (!status || status.verified) return null

  const handleResend = async () => {
    setIsSending(true)
    try {
      const result = await resendEmailVerificationAction()
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success("Te enviamos un enlace nuevo", { description: `Revisá ${result.email}, también la carpeta de spam.` })
    } catch {
      toast.error(UNEXPECTED_MESSAGE)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div
      role="region"
      aria-label="Confirmación de email"
      className="mb-6 flex flex-col gap-3 rounded-lg border border-amber-300/70 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-start gap-2">
        <MailWarning className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <strong className="font-semibold">Confirmá tu email.</strong> Te enviamos un enlace cuando creaste la cuenta. Podés usar AdHorarium
          igual, pero confirmarlo asegura que puedas recuperar tu cuenta.
        </span>
      </p>
      <Button type="button" variant="outline" size="sm" className="shrink-0 bg-card" disabled={isSending} onClick={() => void handleResend()}>
        {isSending ? "Enviando..." : "Reenviar email"}
      </Button>
    </div>
  )
}
