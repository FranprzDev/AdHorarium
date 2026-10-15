import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BadgeVariant } from "@/types/enums"
import { Trophy, Star } from "lucide-react"

interface AverageGradeCardProps {
  averageGrade: number | null
  approvedSubjectsCount: number
}

export function AverageGradeCard({ averageGrade, approvedSubjectsCount }: AverageGradeCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-base font-semibold">
          <Trophy className="mr-2 h-4 w-4 text-brand-strong" />
          Promedio Arg
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          {averageGrade !== null ? (
            <>
              <div className="mb-2 font-serif text-5xl font-semibold text-foreground">{averageGrade}</div>
              <p className="text-sm text-muted-foreground">
                Basado en {approvedSubjectsCount} materia{approvedSubjectsCount !== 1 ? "s" : ""} promocionada
                {approvedSubjectsCount !== 1 ? "s" : ""}
              </p>
              <div className="mt-3">
                {averageGrade >= 8 && (
                  <Badge variant={BadgeVariant.Promocionado}>
                    <Star className="mr-1 h-3 w-3" />
                    Excelente
                  </Badge>
                )}
                {averageGrade >= 6 && averageGrade < 8 && <Badge variant={BadgeVariant.Cursando}>Muy Bueno</Badge>}
                {averageGrade >= 4 && averageGrade < 6 && <Badge variant={BadgeVariant.Regular}>Bueno</Badge>}
              </div>
            </>
          ) : (
            <div className="py-4 text-center">
              <div className="mb-2 font-serif text-3xl text-muted-foreground">--</div>
              <p className="text-sm text-muted-foreground">No hay materias promocionadas registradas</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
