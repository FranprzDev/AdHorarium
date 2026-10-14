"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertCircle, Link2, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { getCareersAction } from "@/app/actions/catalog"
import { listAdminSubjectsAction } from "@/app/actions/admin"
import type { AdminSubject } from "@/db/queries/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SUBJECT_LEVELS } from "@/lib/subject-levels"
import type { AdminSubjectFilters } from "@/lib/validation/admin"
import { BadgeVariant } from "@/types/enums"
import type { Career } from "@/types/types"
import { CorrelativesDialog } from "./CorrelativesDialog"
import { DeleteSubjectDialog } from "./DeleteSubjectDialog"
import { SubjectFormDialog } from "./SubjectFormDialog"

const ALL_OPTION = "all"
const SEARCH_DEBOUNCE_MS = 300

enum DialogKind {
  Create = "create",
  Edit = "edit",
  Delete = "delete",
  Correlatives = "correlatives",
}

type OpenDialog = { kind: DialogKind.Create } | { kind: Exclude<DialogKind, DialogKind.Create>; subject: AdminSubject } | null

function parseOptionalId(value: string): number | null {
  return value === ALL_OPTION ? null : Number(value)
}

export function AdminSubjectsPanel() {
  const [careers, setCareers] = useState<Career[]>([])
  const [subjects, setSubjects] = useState<AdminSubject[]>([])
  const [careerId, setCareerId] = useState<number | null>(null)
  const [level, setLevel] = useState<number | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<OpenDialog>(null)

  useEffect(() => {
    const load = async () => {
      const result = await getCareersAction()
      if (result.ok) setCareers(result.data)
      else setError(result.error)
    }
    void load()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const loadSubjects = useCallback(async () => {
    setIsLoading(true)
    const filters: AdminSubjectFilters = { careerId, level, search }
    const result = await listAdminSubjectsAction(filters)
    if (result.ok) {
      setSubjects(result.data)
      setError(null)
    } else {
      setError(result.error)
    }
    setIsLoading(false)
  }, [careerId, level, search])

  useEffect(() => {
    void loadSubjects()
  }, [loadSubjects])

  const closeDialog = () => setDialog(null)

  const handleSaved = async () => {
    closeDialog()
    await loadSubjects()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Administración</h1>
          <p className="text-purple-200">Gestioná las materias y correlativas de cada plan de estudios.</p>
        </div>
        <Button
          onClick={() => setDialog({ kind: DialogKind.Create })}
          disabled={careers.length === 0}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva materia
        </Button>
      </div>

      <div className="glass-card p-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Select value={careerId === null ? ALL_OPTION : String(careerId)} onValueChange={(value) => setCareerId(parseOptionalId(value))}>
          <SelectTrigger className="bg-transparent border-purple-500/30 text-white" aria-label="Filtrar por carrera">
            <SelectValue placeholder="Carrera" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_OPTION}>Todas las carreras</SelectItem>
            {careers.map((career) => (
              <SelectItem key={career.id} value={String(career.id)}>
                {career.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={level === null ? ALL_OPTION : String(level)} onValueChange={(value) => setLevel(parseOptionalId(value))}>
          <SelectTrigger className="bg-transparent border-purple-500/30 text-white" aria-label="Filtrar por nivel">
            <SelectValue placeholder="Nivel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_OPTION}>Todos los niveles</SelectItem>
            {SUBJECT_LEVELS.map((value) => (
              <SelectItem key={value} value={String(value)}>
                Nivel {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-300" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre"
            aria-label="Buscar materia por nombre"
            className="pl-9 bg-transparent border-purple-500/30 text-white placeholder:text-purple-300"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-red-300">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="glass-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-purple-500/30 hover:bg-transparent">
              <TableHead className="text-purple-200">N°</TableHead>
              <TableHead className="text-purple-200">Materia</TableHead>
              <TableHead className="text-purple-200">Carrera</TableHead>
              <TableHead className="text-purple-200">Nivel</TableHead>
              <TableHead className="text-purple-200">Horas</TableHead>
              <TableHead className="text-purple-200">Mesa</TableHead>
              <TableHead className="text-purple-200 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow className="border-purple-500/20">
                <TableCell colSpan={7} className="text-center text-purple-200">
                  <Loader2 className="inline h-4 w-4 mr-2 animate-spin" />
                  Cargando materias...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && subjects.length === 0 && (
              <TableRow className="border-purple-500/20">
                <TableCell colSpan={7} className="text-center text-purple-200">
                  No hay materias que coincidan con los filtros.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              subjects.map((subject) => (
                <TableRow key={subject.id} className="border-purple-500/20 hover:bg-white/5">
                  <TableCell className="text-white">{subject.number}</TableCell>
                  <TableCell className="text-white">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{subject.name}</span>
                      {subject.isElective && <Badge variant={BadgeVariant.Outline} className="text-purple-200">Electiva</Badge>}
                      {subject.isBasicScience && <Badge variant={BadgeVariant.Outline} className="text-purple-200">Ciencias básicas</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-purple-200">{subject.careerName}</TableCell>
                  <TableCell className="text-white">{subject.level}</TableCell>
                  <TableCell className="text-white">{subject.hours ?? "-"}</TableCell>
                  <TableCell className="text-white">{subject.examTable ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Correlativas de ${subject.name}`}
                        title="Correlativas"
                        className="text-purple-200 hover:text-white hover:bg-purple-700/30"
                        onClick={() => setDialog({ kind: DialogKind.Correlatives, subject })}
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${subject.name}`}
                        title="Editar"
                        className="text-purple-200 hover:text-white hover:bg-purple-700/30"
                        onClick={() => setDialog({ kind: DialogKind.Edit, subject })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Eliminar ${subject.name}`}
                        title="Eliminar"
                        className="text-red-300 hover:text-white hover:bg-red-700/30"
                        onClick={() => setDialog({ kind: DialogKind.Delete, subject })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {dialog?.kind === DialogKind.Create && (
        <SubjectFormDialog careers={careers} defaultCareerId={careerId} subject={null} onClose={closeDialog} onSaved={handleSaved} />
      )}
      {dialog?.kind === DialogKind.Edit && (
        <SubjectFormDialog careers={careers} defaultCareerId={careerId} subject={dialog.subject} onClose={closeDialog} onSaved={handleSaved} />
      )}
      {dialog?.kind === DialogKind.Delete && <DeleteSubjectDialog subject={dialog.subject} onClose={closeDialog} onDeleted={handleSaved} />}
      {dialog?.kind === DialogKind.Correlatives && <CorrelativesDialog subject={dialog.subject} onClose={closeDialog} />}
    </div>
  )
}
