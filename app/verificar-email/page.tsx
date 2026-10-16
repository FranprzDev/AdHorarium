import type { Metadata } from "next"
import Link from "next/link"
import { AuthCard } from "@/components/auth/auth-card"
import { ConfirmEmailForm } from "@/components/auth/confirm-email-form"
import { FormError } from "@/components/auth/form-error"

export const metadata: Metadata = {
  title: "Confirmar email",
  description: "Confirmá el email de tu cuenta de AdHorarium.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

type ConfirmEmailPageProps = {
  searchParams: Promise<{ token?: string | string[] }>
}

export default async function ConfirmEmailPage({ searchParams }: ConfirmEmailPageProps) {
  const { token } = await searchParams
  const value = Array.isArray(token) ? token[0] : token
  return (
    <AuthCard
      eyebrow="Tu cuenta"
      title="Confirmá tu email"
      description="Confirmar tu email nos asegura que podés recuperar tu cuenta si olvidás la contraseña."
      footer={
        <Link href="/dashboard" className="font-medium text-brand-strong underline-offset-4 hover:underline">
          Ir a mi panel
        </Link>
      }
    >
      {value ? (
        <ConfirmEmailForm token={value} />
      ) : (
        <FormError message="El enlace está incompleto. Abrilo de nuevo desde el email o pedí uno nuevo desde el aviso en tu panel." />
      )}
    </AuthCard>
  )
}
