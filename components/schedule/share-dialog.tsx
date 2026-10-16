"use client"

import { useState } from "react"
import { Check, Copy, Loader2, Share2 } from "lucide-react"
import { toast } from "sonner"
import { createScheduleShareAction } from "@/app/actions/schedule"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SHARED_SCHEDULE_PATH } from "@/lib/schedule/labels"
import { MAX_DISPLAY_NAME_LENGTH } from "@/lib/schedule/validation"

type ShareDialogProps = {
  disabled: boolean
  defaultDisplayName: string
}

/** Creates a read-only link to the current timetable, copies it and offers the native share sheet. */
export function ShareDialog({ disabled, defaultDisplayName }: ShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [displayName, setDisplayName] = useState(defaultDisplayName)
  const [link, setLink] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [copied, setCopied] = useState(false)

  const open = () => {
    setLink(null)
    setCopied(false)
    setIsOpen(true)
  }

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Enlace copiado")
    } catch {
      toast.info("Copiá el enlace manualmente")
    }
  }

  const create = async () => {
    setIsCreating(true)
    const result = await createScheduleShareAction({ displayName })
    setIsCreating(false)
    if (!result.ok) {
      toast.error("No se pudo crear el enlace", { description: result.error })
      return
    }
    const url = `${window.location.origin}${SHARED_SCHEDULE_PATH}/${result.data}`
    setLink(url)
    await copy(url)
  }

  const nativeShare = async (url: string) => {
    try {
      await navigator.share({ title: "Mi horario en AdHorarium", text: "Mirá mi horario e importalo para armar el tuyo", url })
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      await copy(url)
    }
  }

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function"

  return (
    <>
      <Button onClick={open} disabled={disabled}>
        <Share2 className="h-4 w-4" />
        Compartir
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Compartir horario</DialogTitle>
            <DialogDescription>
              Creamos un enlace de solo lectura con tus materias y comisiones. Quien lo abra puede importarlo y armar su propio
              horario. No incluye tu email ni tus notas.
            </DialogDescription>
          </DialogHeader>
          {link === null ? (
            <div className="space-y-2">
              <Label htmlFor="share-display-name">Nombre visible (opcional)</Label>
              <Input
                id="share-display-name"
                value={displayName}
                maxLength={MAX_DISPLAY_NAME_LENGTH}
                placeholder="Por ejemplo: Fran"
                onChange={(event) => setDisplayName(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">Dejalo vacío para compartirlo sin nombre.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="share-link">Enlace</Label>
              <div className="flex gap-2">
                <Input id="share-link" value={link} readOnly onFocus={(event) => event.currentTarget.select()} />
                <Button variant="outline" size="icon" onClick={() => void copy(link)} aria-label="Copiar enlace">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                El enlace muestra tu horario de este momento; las comisiones del catálogo se ven siempre actualizadas.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            {link === null ? (
              <Button onClick={() => void create()} disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear enlace
              </Button>
            ) : (
              canNativeShare && (
                <Button onClick={() => void nativeShare(link)}>
                  <Share2 className="h-4 w-4" />
                  Compartir…
                </Button>
              )
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
