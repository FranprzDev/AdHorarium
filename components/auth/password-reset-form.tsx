"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { CheckCircle2, KeyRound } from "lucide-react"
import { resetPasswordAction } from "@/app/actions/password-reset"
import { FormError } from "@/components/auth/form-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PASSWORD_RESET_REQUEST_PATH } from "@/lib/auth/password-reset-config"
import { MIN_PASSWORD_LENGTH, passwordResetInputSchema } from "@/lib/validation/auth"
import { PasswordResetErrorCode } from "@/types/enums"

const UNEXPECTED_MESSAGE = "No pudimos cambiar la contraseña. Probá de nuevo en unos minutos."

export function PasswordResetForm({ token }: { token: string }) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isTokenInvalid, setIsTokenInvalid] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const input = { token, password, confirmPassword }
    const parsed = passwordResetInputSchema.safeParse(input)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? UNEXPECTED_MESSAGE)
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await resetPasswordAction(input)
      if (!result.ok) {
        setError(result.message)
        setIsTokenInvalid(result.code === PasswordResetErrorCode.InvalidToken)
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
          Listo, cambiaste tu contraseña. Ya podés iniciar sesión con la nueva.
        </p>
        <Button asChild className="h-11 w-full">
          <Link href="/ingresar">Iniciar sesión</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña nueva</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-describedby="password-hint"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <p id="password-hint" className="text-xs text-muted-foreground">
          Al menos {MIN_PASSWORD_LENGTH} caracteres, combinando letras y números.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Repetí la contraseña</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
      </div>
      <FormError message={error} />
      {isTokenInvalid && (
        <p className="text-sm">
          <Link href={PASSWORD_RESET_REQUEST_PATH} className="font-medium text-brand-strong underline-offset-4 hover:underline">
            Pedir un enlace nuevo
          </Link>
        </p>
      )}
      <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
        <KeyRound className="h-4 w-4" />
        {isSubmitting ? "Guardando..." : "Guardar contraseña"}
      </Button>
    </form>
  )
}
