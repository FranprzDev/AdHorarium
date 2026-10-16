"use client"

import { useState, type FormEvent } from "react"
import { signIn } from "next-auth/react"
import { UserPlus } from "lucide-react"
import { registerStudentAction } from "@/app/actions/auth"
import { FormError } from "@/components/auth/form-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DEFAULT_AFTER_SIGN_IN_PATH } from "@/lib/auth/callback"
import { MIN_PASSWORD_LENGTH, registerInputSchema } from "@/lib/validation/auth"
import { AuthProvider } from "@/types/enums"

const UNEXPECTED_MESSAGE = "No pudimos crear la cuenta. Probá de nuevo en unos minutos."
const SIGN_IN_AFTER_REGISTER_MESSAGE = "Tu cuenta se creó, pero no pudimos iniciar sesión. Ingresá con tu email y contraseña."

export function RegisterForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const input = { name, email, password, confirmPassword }
    const parsed = registerInputSchema.safeParse(input)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? UNEXPECTED_MESSAGE)
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await registerStudentAction(input)
      if (!result.ok) {
        setError(result.message)
        return
      }
      const signInResult = await signIn(AuthProvider.Credentials, {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      })
      if (signInResult.error) {
        setError(SIGN_IN_AFTER_REGISTER_MESSAGE)
        return
      }
      window.location.assign(DEFAULT_AFTER_SIGN_IN_PATH)
    } catch {
      setError(UNEXPECTED_MESSAGE)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required />
      </div>
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
        <Label htmlFor="password">Contraseña</Label>
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
      <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
        <UserPlus className="h-4 w-4" />
        {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
      </Button>
    </form>
  )
}
