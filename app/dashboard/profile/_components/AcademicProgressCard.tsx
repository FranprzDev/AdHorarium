import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AcademicProgressCardProps {
  approvedSubjectsCount: number
  averageGrade: number | null
  gpaEquivalent: number | null
  selectedCareerName: string
}

export function AcademicProgressCard({ 
  approvedSubjectsCount, 
  averageGrade, 
  gpaEquivalent, 
  selectedCareerName 
}: AcademicProgressCardProps) {
  return (
    <Card className="glass-card mb-6">
      <CardHeader>
        <CardTitle className="text-white">Progreso Académico</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-purple-600/10 border border-purple-400/20">
              <div className="text-2xl font-bold text-purple-300 mb-1">
                {approvedSubjectsCount}
              </div>
              <div className="text-sm text-purple-200">Promocionadas</div>
            </div>
            
            <div className="p-4 rounded-lg bg-blue-600/10 border border-blue-400/20">
              <div className="text-2xl font-bold text-blue-300 mb-1">
                {averageGrade || '--'}
              </div>
              <div className="text-sm text-blue-200">Promedio Arg</div>
            </div>
            
            <div className="p-4 rounded-lg bg-yellow-600/10 border border-yellow-400/20">
              <div className="text-2xl font-bold text-yellow-300 mb-1">
                {gpaEquivalent ? gpaEquivalent.toFixed(2) : '--'}
              </div>
              <div className="text-sm text-yellow-200">Promedio GPA</div>
            </div>
          </div>
          
          {selectedCareerName === "No asignada" && (
            <div className="mt-4 p-4 bg-amber-600/10 border border-amber-400/20 rounded-lg">
              <p className="text-amber-200 text-sm text-center">
                💡 Selecciona tu carrera para obtener mejor seguimiento de tu progreso académico
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 