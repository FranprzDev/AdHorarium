"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteMyAccountAction, getAccountDeletionRequirementAction, type AccountDeletionRequirement } from "@/app/actions/account"
import { FormError } from "@/components/auth/form-error"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AccountDeletionConfirmation } from "@/types/enums"

const UNEXPECTED_MESSAGE = "No pudimos eliminar tu cuenta. Probá de nuevo en unos minutos."
const AFTER_DELETION_PATH = "/"

export function DeleteAccountCard() {
  const router = useRouter()
  const [requirement, setRequirement] = useState<AccountDeletionRequirement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      const result = await getAccountDeletionRequirementAction()
      if (active && result.ok) setRequirement(result.data)
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const usesPassword = requirement?.confirmation === AccountDeletionConfirmation.Password

  const handleOpenChange = (open: boolean) => {
    if (isDeleting) return
    setIsOpen(open)
    setConfirmation("")
    setError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!confirmation.trim()) {
      setError(usesPassword ? "Ingresá tu contraseña" : "Escribí tu email")
      return
    }
    setIsDeleting(true)
    setError(null)
    try {
      const result = await deleteMyAccountAction({ confirmation })
      if (!result.ok) {
        setError(result.message)
        setIsDeleting(false)
        return
      }
      toast.success("Eliminamos tu cuenta", { description: "Borramos tu cuenta y todos tus datos de AdHorarium." })
      await signOut({ redirect: false })
      router.replace(AFTER_DELETION_PATH)
    } catch {
      setError(UNEXPECTED_MESSAGE)
      setIsDeleting(false)
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="font-serif text-xl">Eliminar mi cuenta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Borra tu cuenta y todos tus datos: estados y notas de materias, horario, enlaces compartidos y accesos. No se puede deshacer.
        </p>
        <Button type="button" variant="destructive" disabled={!requirement} onClick={() => handleOpenChange(true)}>
          <Trash2 className="h-4 w-4" />
          Eliminar mi cuenta
        </Button>
      </CardContent>

      <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar tu cuenta para siempre?</AlertDialogTitle>
              <AlertDialogDescription>
                Vamos a borrar tu cuenta y todos tus datos de AdHorarium. Los enlaces de horario que compartiste dejan de funcionar. Esta acción no se
                puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">
                {usesPassword ? "Ingresá tu contraseña para confirmar" : `Escribí ${requirement?.email ?? "tu email"} para confirmar`}
              </Label>
              <Input
                id="delete-confirmation"
                name="confirmation"
                type={usesPassword ? "password" : "email"}
                autoComplete={usesPassword ? "current-password" : "off"}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                disabled={isDeleting}
              />
            </div>
            <FormError message={error} />
            <AlertDialogFooter>
              <AlertDialogCancel type="button" disabled={isDeleting}>
                Cancelar
              </AlertDialogCancel>
              <Button type="submit" variant="destructive" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {isDeleting ? "Eliminando..." : "Eliminar definitivamente"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
