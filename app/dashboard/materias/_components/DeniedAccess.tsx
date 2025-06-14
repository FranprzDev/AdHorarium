import { AuroraBackground } from '@/components/ui/aurora-background'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import React from 'react'

function DeniedAccess() {
  return (
      <AuroraBackground className="min-h-screen">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Acceso Requerido</h2>
              <p className="text-red-400 max-w-md">
                Necesitas iniciar sesión para acceder al gestor de materias.
              </p>
                <Button 
                  onClick={() => window.location.href = '/'}    
                  className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Ir al Inicio
                </Button>
            </div>
          </div>
        </div>
      </AuroraBackground>
    )
}

export default DeniedAccess