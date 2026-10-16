import Link from "next/link"
import { AuthCard } from "@/components/auth/auth-card"
import { PasswordResetRequestForm } from "@/components/auth/password-reset-request-form"

export const metadata = {
  title: "Recuperar contraseña",
  description: "Pedí un enlace para elegir una contraseña nueva para tu cuenta de AdHorarium.",
}

export default function PasswordResetRequestPage() {
  return (
    <AuthCard
      eyebrow="Tu cuenta"
      title="Recuperá tu contraseña"
      description="Ingresá el email de tu cuenta y te enviamos un enlace para elegir una contraseña nueva."
      footer={
        <>
          ¿Te acordaste?{" "}
          <Link href="/ingresar" className="font-medium text-brand-strong underline-offset-4 hover:underline">
            Volvé a iniciar sesión
          </Link>
        </>
      }
    >
      <PasswordResetRequestForm />
    </AuthCard>
  )
}
