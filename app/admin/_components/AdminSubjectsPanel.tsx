"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertCircle, CalendarClock, ChevronLeft, ChevronRight, FileUp, Link2, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { getCareersAction } from "@/app/actions/catalog"
import { listAdminSubjectsAction } from "@/app/actions/admin"
import type { AdminSubject } from "@/db/queries/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ADMIN_PAGE_SIZE, paginate } from "@/lib/pagination"
import { SUBJECT_LEVELS } from "@/lib/subject-levels"
import type { AdminSubjectFilters } from "@/lib/validation/admin"
import { BadgeVariant } from "@/types/enums"
import type { Career } from "@/types/types"
import { CommissionsDialog } from "./CommissionsDialog"
import { CorrelativesDialog } from "./CorrelativesDialog"
import { DeleteSubjectDialog } from "./DeleteSubjectDialog"
import { ImportCommissionsDialog } from "./ImportCommissionsDialog"
import { SubjectFormDialog } from "./SubjectFormDialog"
import { PageHeader } from "@/components/brand/page-header"
import { careerLabel } from "@/lib/careers"

const ALL_OPTION = "all"
const SEARCH_DEBOUNCE_MS = 300

enum DialogKind {
  Create = "create",
  Edit = "edit",
  Delete = "delete",
  Correlatives = "correlatives",
  Commissions = "commissions",
  ImportCommissions = "import-commissions",
}

type SubjectAction = Exclude<DialogKind, DialogKind.Create | DialogKind.ImportCommissions>

type OpenDialog = { kind: DialogKind.Create | DialogKind.ImportCommissions } | { kind: SubjectAction; subject: AdminSubject } | null

function parseOptionalId(value: string): number | null {
  return value === ALL_OPTION ? null : Number(value)
}

function SubjectActions({ subject, onAction }: { subject: AdminSubject; onAction: (kind: SubjectAction, subject: AdminSubject) => void }) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Comisiones y horarios de ${subject.name}`}
        title="Comisiones y horarios"
        className="text-muted-foreground hover:text-foreground"
        onClick={() => onAction(DialogKind.Commissions, subject)}
      >
        <CalendarClock className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Correlativas de ${subject.name}`}
        title="Correlativas"
        className="text-muted-foreground hover:text-foreground"
        onClick={() => onAction(DialogKind.Correlatives, subject)}
      >
        <Link2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Editar ${subject.name}`}
        title="Editar"
        className="text-muted-foreground hover:text-foreground"
        onClick={() => onAction(DialogKind.Edit, subject)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Eliminar ${subject.name}`}
        title="Eliminar"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => onAction(DialogKind.Delete, subject)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

function SubjectBadges({ subject }: { subject: AdminSubject }) {
  return (
    <>
      {subject.isElective && <Badge variant={BadgeVariant.Outline} className="text-muted-foreground">Electiva</Badge>}
      {subject.isBasicScience && <Badge variant={BadgeVariant.Outline} className="text-muted-foreground">Ciencias básicas</Badge>}
    </>
  )
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
  const [page, setPage] = useState(1)

  useEffect(() => {
    const load = async () => {
      const result = await getCareersAction()
      if (result.ok) setCareers(result.data)
      else setError(result.error)
    }
    void load()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
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
  const openSubjectDialog = (kind: SubjectAction, subject: AdminSubject) => setDialog({ kind, subject })
  const changeCareer = (value: string) => {
    setCareerId(parseOptionalId(value))
    setPage(1)
  }
  const changeLevel = (value: string) => {
    setLevel(parseOptionalId(value))
    setPage(1)
  }
  const visible = paginate(subjects, page, ADMIN_PAGE_SIZE)
  const showPager = !isLoading && visible.total > 0

  const handleSaved = async () => {
    closeDialog()
    await loadSubjects()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <PageHeader
          eyebrow="Panel de administración"
          title="Administración"
          description="Gestioná las materias, correlativas y comisiones con horarios de cada plan de estudios."
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setDialog({ kind: DialogKind.ImportCommissions })}>
            <FileUp className="h-4 w-4" />
            Importar comisiones
          </Button>
          <Button onClick={() => setDialog({ kind: DialogKind.Create })} disabled={careers.length === 0}>
            <Plus className="h-4 w-4" />
            Nueva materia
          </Button>
        </div>
      </div>

      <div className="surface-card grid grid-cols-1 gap-3 p-4 lg:grid-cols-3">
        <Select value={careerId === null ? ALL_OPTION : String(careerId)} onValueChange={changeCareer}>
          <SelectTrigger className="bg-background" aria-label="Filtrar por carrera">
            <SelectValue placeholder="Carrera" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_OPTION}>Todas las carreras</SelectItem>
            {careers.map((career) => (
              <SelectItem key={career.id} value={String(career.id)}>
                {careerLabel(career, careers)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={level === null ? ALL_OPTION : String(level)} onValueChange={changeLevel}>
          <SelectTrigger className="bg-background" aria-label="Filtrar por nivel">
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre o número"
            aria-label="Buscar materia por nombre o número"
            className="bg-background pl-9"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="surface-card hidden overflow-x-auto lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">N°</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Materia</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Carrera</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nivel</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Horas</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mesa</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  <Loader2 className="inline h-4 w-4 mr-2 animate-spin" />
                  Cargando materias...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && subjects.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No hay materias que coincidan con los filtros.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              visible.items.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell>{subject.number}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{subject.name}</span>
                      <SubjectBadges subject={subject} />
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{subject.careerName}</TableCell>
                  <TableCell>{subject.level}</TableCell>
                  <TableCell>{subject.hours ?? "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">{subject.examTable ?? "-"}</TableCell>
                  <TableCell>
                    <SubjectActions subject={subject} onAction={openSubjectDialog} />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-3 lg:hidden" aria-label="Materias">
        {isLoading && (
          <li className="surface-card flex items-center justify-center p-4 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Cargando materias...
          </li>
        )}
        {!isLoading && subjects.length === 0 && (
          <li className="surface-card p-4 text-center text-sm text-muted-foreground">No hay materias que coincidan con los filtros.</li>
        )}
        {!isLoading &&
          visible.items.map((subject) => (
            <li key={subject.id} className="surface-card space-y-3 p-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  N° {subject.number} · Nivel {subject.level}
                  {subject.hours !== null && ` · ${subject.hours} h`}
                  {subject.examTable !== null && ` · ${subject.examTable}`}
                </p>
                <p className="font-semibold leading-snug text-foreground">{subject.name}</p>
                <p className="text-sm text-muted-foreground">{subject.careerName}</p>
                {(subject.isElective || subject.isBasicScience) && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <SubjectBadges subject={subject} />
                  </div>
                )}
              </div>
              <div className="border-t border-border pt-2">
                <SubjectActions subject={subject} onAction={openSubjectDialog} />
              </div>
            </li>
          ))}
      </ul>

      {showPager && (
        <nav aria-label="Paginación de materias" className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Mostrando {visible.firstItem}–{visible.lastItem} de {visible.total} materias
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(visible.page - 1)} disabled={visible.page === 1}>
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="min-w-24 text-center text-sm tabular-nums text-muted-foreground">
              Página {visible.page} de {visible.pageCount}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage(visible.page + 1)} disabled={visible.page === visible.pageCount}>
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      )}

      {dialog?.kind === DialogKind.Create && (
        <SubjectFormDialog careers={careers} defaultCareerId={careerId} subject={null} onClose={closeDialog} onSaved={handleSaved} />
      )}
      {dialog?.kind === DialogKind.Edit && (
        <SubjectFormDialog careers={careers} defaultCareerId={careerId} subject={dialog.subject} onClose={closeDialog} onSaved={handleSaved} />
      )}
      {dialog?.kind === DialogKind.Delete && <DeleteSubjectDialog subject={dialog.subject} onClose={closeDialog} onDeleted={handleSaved} />}
      {dialog?.kind === DialogKind.Correlatives && <CorrelativesDialog subject={dialog.subject} onClose={closeDialog} />}
      {dialog?.kind === DialogKind.Commissions && <CommissionsDialog subject={dialog.subject} onClose={closeDialog} />}
      {dialog?.kind === DialogKind.ImportCommissions && <ImportCommissionsDialog onClose={closeDialog} />}
    </div>
  )
}
