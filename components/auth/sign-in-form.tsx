"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { LogIn } from "lucide-react"
import { FormError } from "@/components/auth/form-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PASSWORD_RESET_REQUEST_PATH } from "@/lib/auth/password-reset-config"
import { signInInputSchema } from "@/lib/validation/auth"
import { AuthProvider, CredentialsErrorCode } from "@/types/enums"

const INVALID_CREDENTIALS_MESSAGE = "Email o contraseña incorrectos."
const RATE_LIMITED_MESSAGE = "Hiciste demasiados intentos. Esperá unos minutos y probá de nuevo."
const UNEXPECTED_MESSAGE = "No pudimos iniciar sesión. Probá de nuevo en unos minutos."

function messageForCode(code: string | undefined): string {
  return code === CredentialsErrorCode.RateLimited ? RATE_LIMITED_MESSAGE : INVALID_CREDENTIALS_MESSAGE
}

export function SignInForm({ callbackPath }: { callbackPath: string }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = signInInputSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? INVALID_CREDENTIALS_MESSAGE)
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await signIn(AuthProvider.Credentials, { ...parsed.data, redirect: false })
      if (result.error) {
        setError(messageForCode(result.code))
        return
      }
      window.location.assign(callbackPath)
    } catch {
      setError(UNEXPECTED_MESSAGE)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    await signIn(AuthProvider.Google, { redirectTo: callbackPath })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Contraseña</Label>
            <Link href={PASSWORD_RESET_REQUEST_PATH} className="text-sm font-medium text-brand-strong underline-offset-4 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <FormError message={error} />
        <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
          <LogIn className="h-4 w-4" />
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>
      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" />
      </div>
      <Button type="button" variant="outline" className="h-11 w-full bg-card" onClick={() => void handleGoogle()}>
        Continuar con Google
      </Button>
    </div>
  )
}
