import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen } from "lucide-react"

interface SubjectsCountCardProps {
  approvedSubjectsCount: number
}

export function SubjectsCountCard({ approvedSubjectsCount }: SubjectsCountCardProps) {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-green-400" />
          Materias Promocionadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-4xl font-bold text-green-400 mb-2">
            {approvedSubjectsCount}
          </div>
          <p className="text-purple-200 text-sm">
            Materias promocionadas con éxito
          </p>
          {approvedSubjectsCount > 0 && (
            <div className="mt-3">
              <Badge className="bg-green-600/20 text-green-400 border-green-400/30">
                ¡Progreso académico!
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 