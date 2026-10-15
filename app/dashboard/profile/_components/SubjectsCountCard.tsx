import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen } from "lucide-react"

interface SubjectsCountCardProps {
  approvedSubjectsCount: number
}

export function SubjectsCountCard({ approvedSubjectsCount }: SubjectsCountCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-base font-semibold">
          <BookOpen className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Materias Promocionadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="mb-2 font-serif text-5xl font-semibold text-foreground">{approvedSubjectsCount}</div>
          <p className="text-sm text-muted-foreground">Materias promocionadas con éxito</p>
        </div>
      </CardContent>
    </Card>
  )
}
