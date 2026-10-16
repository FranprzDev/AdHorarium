"use client"

import { useEffect, useState } from "react"
import { ZodError } from "zod"
import { AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/brand/page-header"
import { BrandLoader } from "@/components/brand/brand-loader"
import { getErrorMessage } from "@/lib/errors"
import { decodeSysacadFragment } from "@/lib/sysacad/payload"
import { parseSysacadPayload } from "@/lib/sysacad/schema"
import { clearStashedFragment, readStashedFragment, stashFragmentFromLocation } from "@/lib/sysacad/stash"
import type { SysacadRow } from "@/lib/sysacad/types"
import { ImportInstructions } from "./ImportInstructions"
import { ImportPreview } from "./ImportPreview"
import { PasteTableForm } from "./PasteTableForm"

enum ViewPhase {
  Reading = "reading",
  Idle = "idle",
  Preview = "preview",
}

function payloadErrorMessage(error: unknown): string {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Los datos de SysAcad no tienen el formato esperado."
  return getErrorMessage(error)
}

/** Import page body: reads the payload the extension sent (or a pasted table) and hands the rows to the preview. */
export function SysacadImportView() {
  const [phase, setPhase] = useState<ViewPhase>(ViewPhase.Reading)
  const [rows, setRows] = useState<SysacadRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      stashFragmentFromLocation()
      const stashed = readStashedFragment()
      if (!stashed) {
        setPhase(ViewPhase.Idle)
        return
      }
      try {
        const payload = parseSysacadPayload(await decodeSysacadFragment(stashed))
        setRows(payload.rows)
        setPhase(ViewPhase.Preview)
      } catch (decodeError) {
        clearStashedFragment()
        setError(payloadErrorMessage(decodeError))
        setPhase(ViewPhase.Idle)
      }
    }
    void load()
  }, [])

  const showRows = (pasted: SysacadRow[]) => {
    setError(null)
    setRows(pasted)
    setPhase(ViewPhase.Preview)
  }

  const discard = () => {
    clearStashedFragment()
    setRows([])
    setPhase(ViewPhase.Idle)
  }

  if (phase === ViewPhase.Reading) return <BrandLoader label="Leyendo los datos de SysAcad..." />

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Importar"
        title="Importar desde SysAcad"
        description="Traé el estado de tus materias desde el Estado académico de SysAcad. Antes de guardar vas a ver qué cambia."
      />
      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {phase === ViewPhase.Preview ? (
        <ImportPreview rows={rows} onDiscard={discard} onImported={clearStashedFragment} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <ImportInstructions />
          <PasteTableForm onRows={showRows} />
        </div>
      )}
    </div>
  )
}
