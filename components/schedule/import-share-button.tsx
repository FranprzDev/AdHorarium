"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { importScheduleShareAction } from "@/app/actions/schedule"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { isEnumValue } from "@/lib/admin/labels"
import { SHARED_SCHEDULE_PATH } from "@/lib/schedule/labels"
import { ScheduleImportMode } from "@/types/enums"

const SCHEDULE_PAGE = "/dashboard/horarios"

type ImportShareButtonProps = {
  shareId: string
  isSignedIn: boolean
}

/** Copies a shared timetable into the signed-in student's own timetable, after choosing merge or replace. */
export function ImportShareButton({ shareId, isSignedIn }: ImportShareButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<ScheduleImportMode>(ScheduleImportMode.Merge)
  const [isImporting, setIsImporting] = useState(false)

  if (!isSignedIn) {
    const callbackUrl = encodeURIComponent(`${SHARED_SCHEDULE_PATH}/${shareId}`)
    return (
      <Button asChild>
        <Link href={`/ingresar?callbackUrl=${callbackUrl}`}>
          <Download className="h-4 w-4" />
          Iniciá sesión para importarlo
        </Link>
      </Button>
    )
  }

  const runImport = async () => {
    setIsImporting(true)
    const result = await importScheduleShareAction({ shareId, mode })
    setIsImporting(false)
    if (!result.ok) {
      toast.error("No se pudo importar el horario", { description: result.error })
      return
    }
    toast.success("Horario importado", { description: result.data })
    setIsOpen(false)
    router.push(SCHEDULE_PAGE)
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Download className="h-4 w-4" />
        Importar a mi horario
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Importar horario</DialogTitle>
            <DialogDescription>
              Se copian las materias de tu carrera. Después podés cambiar comisiones o quitar materias libremente.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={mode}
            onValueChange={(value) => {
              if (isEnumValue(ScheduleImportMode, value)) setMode(value)
            }}
            className="space-y-2"
          >
            <Label htmlFor="import-merge" className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 font-normal">
              <RadioGroupItem id="import-merge" value={ScheduleImportMode.Merge} className="mt-0.5" />
              <span>
                <span className="block font-medium text-foreground">Combinar</span>
                <span className="text-sm text-muted-foreground">Agrega las materias que no tenés. Las que ya tenés no cambian.</span>
              </span>
            </Label>
            <Label htmlFor="import-replace" className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 font-normal">
              <RadioGroupItem id="import-replace" value={ScheduleImportMode.Replace} className="mt-0.5" />
              <span>
                <span className="block font-medium text-foreground">Reemplazar</span>
                <span className="text-sm text-muted-foreground">Borra tu horario actual y lo reemplaza por este.</span>
              </span>
            </Label>
          </RadioGroup>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void runImport()} disabled={isImporting} variant={mode === ScheduleImportMode.Replace ? "destructive" : "default"}>
              {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === ScheduleImportMode.Replace ? "Reemplazar mi horario" : "Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
