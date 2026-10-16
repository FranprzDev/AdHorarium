import type { Metadata } from "next"
import { auth } from "@/auth"
import { BrandLoader } from "@/components/brand/brand-loader"
import { MainLayout } from "@/components/layout/main-layout"
import { SignInRedirect } from "./_components/SignInRedirect"
import { SysacadImportView } from "./_components/SysacadImportView"

export const metadata: Metadata = {
  title: "Importar desde SysAcad",
  description: "Cargá en AdHorarium el estado de tus materias de SysAcad (UTN FRT): aprobadas con nota, regulares y las que cursás.",
  robots: { index: false, follow: false },
}

/**
 * Receives the SysAcad payload in the URL fragment. The server never sees the fragment, so signing in is handled in
 * the browser: the fragment is stashed in sessionStorage before going to the sign-in page and read back afterwards.
 */
export default async function SysacadImportPage() {
  const session = await auth()
  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-background">
        <BrandLoader label="Te llevamos a iniciar sesión..." />
        <SignInRedirect />
      </div>
    )
  }
  return (
    <MainLayout>
      <SysacadImportView />
    </MainLayout>
  )
}
