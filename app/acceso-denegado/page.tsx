import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { PublicHeader } from "@/components/layout/public-header"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Acceso denegado",
  description: "Esta sección es solo para administradores de AdHorarium.",
}

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="flex items-center justify-center px-4 py-16 md:py-24">
        <div className="surface-card flex max-w-lg flex-col items-center gap-4 p-8 text-center md:p-10">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </span>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Acceso denegado</h1>
          <p className="text-muted-foreground">
            Esta sección es solo para administradores. Si creés que deberías tener acceso, cerrá sesión y volvé a ingresar
            con una cuenta habilitada.
          </p>
          <Button asChild className="mt-2">
            <Link href="/dashboard">Volver al panel</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
