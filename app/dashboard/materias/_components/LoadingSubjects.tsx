import { AuroraBackground } from '@/components/ui/aurora-background'
import { Loader2 } from 'lucide-react'
import React from 'react'

function LoadingSubjects() {
    return (
        <AuroraBackground className="min-h-screen">
          <div className="container mx-auto px-4 py-8 flex items-center justify-center">
            <div className="flex items-center gap-2 text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Cargando materias...</span>
            </div>
          </div>
        </AuroraBackground>
      )
}

export default LoadingSubjects
