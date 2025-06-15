import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star } from "lucide-react"

interface AverageGradeCardProps {
  averageGrade: number | null
  approvedSubjectsCount: number
}

export function AverageGradeCard({ averageGrade, approvedSubjectsCount }: AverageGradeCardProps) {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
          Promedio Arg
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          {averageGrade !== null ? (
            <>
              <div className="text-4xl font-bold text-yellow-400 mb-2">
                {averageGrade}
              </div>
              <p className="text-purple-200 text-sm">
                Basado en {approvedSubjectsCount} materia{approvedSubjectsCount !== 1 ? 's' : ''} promocionada{approvedSubjectsCount !== 1 ? 's' : ''}
              </p>
              <div className="mt-3">
                {averageGrade >= 8 && (
                  <Badge className="bg-green-600 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Excelente
                  </Badge>
                )}
                {averageGrade >= 6 && averageGrade < 8 && (
                  <Badge className="bg-blue-600 text-white">
                    Muy Bueno
                  </Badge>
                )}
                {averageGrade >= 4 && averageGrade < 6 && (
                  <Badge className="bg-yellow-600 text-white">
                    Bueno
                  </Badge>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-2xl text-purple-300 mb-2">--</div>
              <p className="text-purple-400 text-sm">
                No hay materias promocionadas registradas
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 