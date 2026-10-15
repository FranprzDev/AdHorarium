"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { deleteSubjectAction } from "@/app/actions/admin"
import type { AdminSubject } from "@/db/queries/admin"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type DeleteSubjectDialogProps = {
  subject: AdminSubject
  onClose: () => void
  onDeleted: () => Promise<void>
}

export function DeleteSubjectDialog({ subject, onClose, onDeleted }: DeleteSubjectDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    const result = await deleteSubjectAction(subject.id)
    setIsDeleting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    await onDeleted()
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar {subject.name}?</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            También se eliminarán sus correlativas, las correlativas que la exigen y los estados que los estudiantes cargaron
            para esta materia. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button onClick={() => void handleDelete()} disabled={isDeleting} variant="destructive">
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Eliminar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
