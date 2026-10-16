"use client"

import { useState, type FormEvent } from "react"
import { ClipboardPaste } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { parseSysacadText } from "@/lib/sysacad/table"
import type { SysacadRow } from "@/lib/sysacad/types"

const NO_ROWS_MESSAGE =
  "No encontramos materias en el texto. En Estado académico seleccioná toda la página (Ctrl+A), copiala (Ctrl+C) y pegala acá."

/** Fallback without the extension: the student pastes the copied "Estado académico" table. */
export function PasteTableForm({ onRows }: { onRows: (rows: SysacadRow[]) => void }) {
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const rows = parseSysacadText(text)
    if (rows.length === 0) {
      setError(NO_ROWS_MESSAGE)
      return
    }
    onRows(rows)
  }

  return (
    <section className="surface-card space-y-4 p-4 md:p-6" aria-labelledby="sysacad-paste-title">
      <div className="flex items-center gap-2">
        <ClipboardPaste className="h-5 w-5 text-brand-strong" aria-hidden />
        <h2 id="sysacad-paste-title" className="font-serif text-xl font-semibold text-foreground">
          Sin extensión: pegá la tabla
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <Label htmlFor="sysacad-text">Tabla de Estado académico</Label>
        <Textarea
          id="sysacad-text"
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            setError(null)
          }}
          rows={10}
          placeholder={"Año\tMateria\tEstado\tPlan\n1\tAlgoritmos y Estructuras de Datos\tAprobada con 8 (5 hs.) ...\t2023"}
          aria-invalid={error !== null}
          aria-describedby={error ? "sysacad-text-error" : "sysacad-text-help"}
          className="font-mono text-xs"
        />
        {error ? (
          <p id="sysacad-text-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : (
          <p id="sysacad-text-help" className="text-xs text-muted-foreground">
            El texto se lee en tu navegador; solo se guarda lo que confirmes en el paso siguiente.
          </p>
        )}
        <Button type="submit" disabled={text.trim() === ""}>
          Leer tabla
        </Button>
      </form>
    </section>
  )
}
