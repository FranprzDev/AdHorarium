import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Info } from "lucide-react"

export function GPAConversionCard() {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Info className="h-5 w-5 mr-2 text-blue-400" />
          Conversión GPA - Sistema Argentino
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-purple-200 text-sm">
            <p className="mb-3">
              <strong>¿Cómo se calcula el GPA?</strong> El GPA (Grade Point Average) es el estándar estadounidense para medir el rendimiento académico en una escala de 0.0 a 4.0.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-purple-600/10 p-3 rounded-lg border border-purple-400/20">
                <h4 className="font-semibold text-purple-100 mb-2">Escala Argentina (1-10)</h4>
                <div className="space-y-1 text-xs">
                  <div>10: Sobresaliente</div>
                  <div>8-9: Muy Bueno</div>
                  <div>7: Bueno</div>
                  <div>6: Aprobado</div>
                  <div>4-5: Regular</div>
                </div>
              </div>
              
              <div className="bg-yellow-600/10 p-3 rounded-lg border border-yellow-400/20">
                <h4 className="font-semibold text-yellow-100 mb-2">Equivalencia GPA (0-4)</h4>
                <div className="space-y-1 text-xs">
                  <div>10 → 4.0 (A)</div>
                  <div>8-9 → 3.7 (A-)</div>
                  <div>7 → 3.0 (B)</div>
                  <div>6 → 2.3 (C+)</div>
                  <div>4-5 → 1.0 (D)</div>
                </div>
              </div>
            </div>

            <p className="text-xs text-purple-300">
              <strong>Nota:</strong> Esta conversión está basada en estándares internacionales utilizados por universidades estadounidenses para evaluar estudiantes argentinos. Un promedio de 7+ argentino se considera competitivo para universidades internacionales.
            </p>
          </div>

          <div className="pt-4 border-t border-purple-400/20">
            <Button 
              disabled 
              className="w-full bg-gray-600/50 text-gray-400 cursor-not-allowed hover:bg-gray-600/50"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Estadísticas Avanzadas - Próximamente
            </Button>
            <p className="text-xs text-purple-400 text-center mt-2">
              Análisis detallado de rendimiento, comparativas y proyecciones académicas
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 