import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Acceso denegado - UTN FRT",
}

export default function AccessDeniedPage() {
  return (
    <AuroraBackground className="min-h-screen">
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <ShieldAlert className="h-12 w-12 text-red-400" />
          <h1 className="text-2xl font-bold text-white">Acceso denegado</h1>
          <p className="text-purple-200 max-w-md">
            Esta sección es solo para administradores. Si creés que deberías tener acceso, cerrá sesión y volvé a ingresar
            con una cuenta habilitada.
          </p>
          <Button asChild className="mt-4 bg-purple-600 hover:bg-purple-700 text-white">
            <Link href="/dashboard">Volver al panel</Link>
          </Button>
        </div>
      </div>
    </AuroraBackground>
  )
}
