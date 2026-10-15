import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info } from "lucide-react"

const ARGENTINE_SCALE = ["10: Sobresaliente", "8-9: Muy Bueno", "7: Bueno", "6: Aprobado", "4-5: Regular"]
const GPA_SCALE = ["10 → 4.0 (A)", "8-9 → 3.7 (A-)", "7 → 3.0 (B)", "6 → 2.3 (C+)", "4-5 → 1.0 (D)"]

export function GPAConversionCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center font-serif text-xl">
          <Info className="mr-2 h-5 w-5 text-primary" />
          Conversión GPA - Sistema Argentino
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">¿Cómo se calcula el GPA?</strong> El GPA (Grade Point Average) es el estándar
            estadounidense para medir el rendimiento académico en una escala de 0.0 a 4.0.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ScaleTable title="Escala Argentina (1-10)" rows={ARGENTINE_SCALE} />
            <ScaleTable title="Equivalencia GPA (0-4)" rows={GPA_SCALE} />
          </div>

          <p className="text-xs">
            <strong className="text-foreground">Nota:</strong> La equivalencia es aproximada y orientativa; cada universidad o
            evaluadora de títulos aplica su propio criterio.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function ScaleTable({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-3">
      <h4 className="mb-2 font-semibold text-foreground">{title}</h4>
      <ul className="space-y-1 text-xs tabular-nums">
        {rows.map((row) => (
          <li key={row}>{row}</li>
        ))}
      </ul>
    </div>
  )
}
