import type { Metadata } from "next"
import Link from "next/link"
import { AuthCard } from "@/components/auth/auth-card"
import { FormError } from "@/components/auth/form-error"
import { PasswordResetForm } from "@/components/auth/password-reset-form"
import { PASSWORD_RESET_REQUEST_PATH } from "@/lib/auth/password-reset-config"

export const metadata: Metadata = {
  title: "Elegir contraseña nueva",
  description: "Elegí una contraseña nueva para tu cuenta de AdHorarium.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

type PasswordResetPageProps = {
  searchParams: Promise<{ token?: string | string[] }>
}

export default async function PasswordResetPage({ searchParams }: PasswordResetPageProps) {
  const { token } = await searchParams
  const value = Array.isArray(token) ? token[0] : token
  return (
    <AuthCard
      eyebrow="Tu cuenta"
      title="Elegí una contraseña nueva"
      description="Después de guardarla vas a poder iniciar sesión con tu email y la contraseña nueva."
      footer={
        <Link href="/ingresar" className="font-medium text-brand-strong underline-offset-4 hover:underline">
          Volver a iniciar sesión
        </Link>
      }
    >
      {value ? (
        <PasswordResetForm token={value} />
      ) : (
        <div className="space-y-4">
          <FormError message="El enlace está incompleto. Abrilo de nuevo desde el email o pedí uno nuevo." />
          <Link href={PASSWORD_RESET_REQUEST_PATH} className="text-sm font-medium text-brand-strong underline-offset-4 hover:underline">
            Pedir un enlace nuevo
          </Link>
        </div>
      )}
    </AuthCard>
  )
}
