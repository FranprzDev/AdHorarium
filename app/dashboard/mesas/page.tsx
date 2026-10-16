"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useMesas } from "./_hooks/useMesas"
import { PageHeader } from "@/components/brand/page-header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, List, TableIcon, BookOpen } from "lucide-react"
import { careerLabel } from "@/lib/careers"
import { EXAM_TABLES, createEmptyExamTableMap } from "@/lib/exam-tables"
import { BadgeVariant, ExamTable, ExamViewMode } from "@/types/enums"

const EXAM_TABLE_VALUES = new Set<string>(EXAM_TABLES)

function isExamTable(value: string): value is ExamTable {
  return EXAM_TABLE_VALUES.has(value)
}

export default function MesasPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ExamViewMode>(ExamViewMode.List)
  const [activeTab, setActiveTab] = useState<ExamTable>(ExamTable.MesaI)
  const { loading, careers, selectedCareer, setSelectedCareer, careerSubjects } = useMesas()

  const filteredSubjects = useMemo(() => {
    if (!careerSubjects) return null

    if (!searchQuery.trim()) {
      return careerSubjects
    }

    const query = searchQuery.toLowerCase().trim()
    const result = createEmptyExamTableMap()

    for (const table of EXAM_TABLES) {
      result[table] = careerSubjects[table].filter((subject) => subject.toLowerCase().includes(query))
    }

    return result
  }, [careerSubjects, searchQuery])

  const allSubjects = useMemo(() => {
    if (!filteredSubjects) return []
    return EXAM_TABLES.flatMap((table) => filteredSubjects[table].map((subject) => ({ subject, table })))
  }, [filteredSubjects])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary"></div>
          <h2 className="mt-4 font-serif text-xl font-semibold text-foreground">Cargando Datos...</h2>
          <p className="text-muted-foreground">Obteniendo la información más reciente de las mesas.</p>
        </div>
      </div>
    )
  }

  return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <PageHeader
          eyebrow="Mesas de examen"
          title="Buscador de Mesa"
          description="Explorá todas las materias y en qué mesa específica se rinde."
        />

        <div className="surface-card p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="mesas-career" className="mb-2 block text-sm font-medium text-foreground">Seleccioná tu carrera</label>
              <Select onValueChange={setSelectedCareer} value={selectedCareer}>
                <SelectTrigger id="mesas-career" className="w-full bg-background">
                  <SelectValue placeholder="Elegí tu carrera..." />
                </SelectTrigger>
                <SelectContent>
                  {careers.map((career) => (
                    <SelectItem key={career.id} value={career.code}>
                      {careerLabel(career, careers)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCareer && (
              <div>
                <label htmlFor="mesas-search" className="mb-2 block text-sm font-medium text-foreground">Buscar Materia</label>
                <div className="relative">
                  <Input
                    placeholder="Escribí para buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    id="mesas-search"
                    className="w-full bg-background pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5">
            <Button
              variant={viewMode === ExamViewMode.List ? "default" : "outline"}
              onClick={() => setViewMode(ExamViewMode.List)}
              size="sm"
              className={viewMode === ExamViewMode.List ? "" : "bg-card"}
            >
              <List className="h-4 w-4" />
              Vista de Cuadrícula
            </Button>
            <Button
              variant={viewMode === ExamViewMode.Table ? "default" : "outline"}
              onClick={() => setViewMode(ExamViewMode.Table)}
              size="sm"
              className={viewMode === ExamViewMode.Table ? "" : "bg-card"}
            >
              <TableIcon className="h-4 w-4" />
              Vista de Tabla
            </Button>
          </div>
        </div>

        {!selectedCareer && (
          <div className="surface-card p-10 text-center">
            <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
              <BookOpen className="h-6 w-6" />
            </span>
            <h2 className="mb-2 font-serif text-xl font-semibold text-foreground">Seleccioná una carrera</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Elegí una carrera de ingeniería del menú desplegable para ver todas las materias y cursos específicos de
              ese programa.
            </p>
          </div>
        )}

        {selectedCareer && filteredSubjects && (
          <>
            {viewMode === ExamViewMode.List ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <AnimatePresence>
                  {allSubjects.length > 0 ? (
                    allSubjects.map(({ subject, table }) => (
                      <motion.div key={`${subject}-${table}`} variants={itemVariants} layout>
                        <Card className="h-full">
                          <CardContent className="p-4 flex flex-col justify-between h-full">
                            <div>
                              <Badge
                                variant={BadgeVariant.Secondary}
                                className="mb-2"
                              >
                                {table}
                              </Badge>
                              <h3
                                className="min-w-0 truncate font-medium text-foreground"
                                title={subject}
                              >
                                {subject}
                              </h3>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="surface-card col-span-full p-8 text-center text-muted-foreground"
                    >
                      No se encontraron materias con ese criterio de búsqueda.
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  if (isExamTable(value)) setActiveTab(value)
                }}
                className="surface-card p-4"
              >
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  {EXAM_TABLES.map((table) => (
                    <TabsTrigger key={table} value={table}>
                      {table}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <AnimatePresence mode="wait">
                  {EXAM_TABLES.map((table) => (
                    <motion.div
                      key={table}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {activeTab === table && (
                        <TabsContent value={table} className="mt-0">
                          <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                          >
                            {filteredSubjects[table] && filteredSubjects[table].length > 0 ? (
                              filteredSubjects[table].map((subject, index) => (
                                <motion.div key={`${subject}-${index}`} variants={itemVariants}>
                                  <Card className="h-full bg-background shadow-none">
                                    <CardContent className="p-4 flex flex-col justify-between h-full">
                                      <h3
                                        className="min-w-0 truncate font-medium text-foreground"
                                        title={subject}
                                      >
                                        {subject}
                                      </h3>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              ))
                            ) : (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full p-8 text-center text-muted-foreground"
                              >
                                No hay materias disponibles para esta mesa.
                              </motion.div>
                            )}
                          </motion.div>
                        </TabsContent>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Tabs>
            )}
          </>
        )}
      </motion.div>
  )
}
