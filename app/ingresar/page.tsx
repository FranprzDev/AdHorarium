import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { AuthCard } from "@/components/auth/auth-card"
import { SignInForm } from "@/components/auth/sign-in-form"
import { safeCallbackPath } from "@/lib/auth/callback"

export const metadata = {
  title: "Iniciar sesión",
  description: "Ingresá a AdHorarium con tu email y contraseña para ver tu plan de estudios, tus materias y el gestor de horarios.",
}

type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[] }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl } = await searchParams
  const callbackPath = safeCallbackPath(Array.isArray(callbackUrl) ? callbackUrl[0] : callbackUrl, (await headers()).get("host"))
  const session = await auth()
  if (session?.user) redirect(callbackPath)
  return (
    <AuthCard
      eyebrow="Tu cuenta"
      title="Iniciá sesión"
      description="Ingresá con tu email y contraseña para ver tu plan, tus materias y el asistente de horarios."
      footer={
        <>
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="font-medium text-brand-strong underline-offset-4 hover:underline">
            Registrate como estudiante
          </Link>
        </>
      }
    >
      <SignInForm callbackPath={callbackPath} />
    </AuthCard>
  )
}
