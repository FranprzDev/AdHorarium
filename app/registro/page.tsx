import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { AuthCard } from "@/components/auth/auth-card"
import { RegisterForm } from "@/components/auth/register-form"
import { DEFAULT_AFTER_SIGN_IN_PATH } from "@/lib/auth/callback"

export const metadata = {
  title: "Crear cuenta",
}

export default async function RegisterPage() {
  const session = await auth()
  if (session?.user) redirect(DEFAULT_AFTER_SIGN_IN_PATH)
  return (
    <AuthCard
      eyebrow="Nueva cuenta"
      title="Creá tu cuenta de estudiante"
      description="Con tu cuenta guardás el estado y las notas de tus materias. Tu contraseña se guarda cifrada."
      footer={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link href="/ingresar" className="font-medium text-brand-strong underline-offset-4 hover:underline">
            Iniciá sesión
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  )
}
