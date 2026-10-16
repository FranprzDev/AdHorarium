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
  selectedCareerName,
}: AcademicProgressCardProps) {
  const stats = [
    { label: "Promocionadas", value: String(approvedSubjectsCount) },
    { label: "Promedio Arg", value: averageGrade ? String(averageGrade) : "--" },
    { label: "Promedio GPA", value: gpaEquivalent ? gpaEquivalent.toFixed(2) : "--" },
  ]

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="font-serif text-xl">Progreso Académico</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="mb-1 font-serif text-3xl font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {selectedCareerName === "No asignada" && (
            <div className="rounded-lg border border-brand/40 bg-brand/10 p-4">
              <p className="text-center text-sm text-foreground">
                Seleccioná tu carrera para obtener mejor seguimiento de tu progreso académico
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
