"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useMesas } from "./_hooks/useMesas"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, List, TableIcon, BookOpen } from "lucide-react"
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
      <AuroraBackground className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-400 mx-auto"></div>
          <h2 className="text-2xl font-semibold text-white mt-4">Cargando Datos...</h2>
          <p className="text-purple-200">Obteniendo la información más reciente de las mesas.</p>
        </div>
      </AuroraBackground>
    )
  }

  return (
    <AuroraBackground className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-6">Buscador de Mesa</h1>
        <p className="text-purple-200 mb-8">
          Explora todas las materias y en qué mesa específica se rinde.
        </p>

        <div className="glass-card p-6 mb-8">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-purple-200 mb-2 block">Selecciona tu Carrera</label>
              <Select onValueChange={setSelectedCareer} value={selectedCareer}>
                <SelectTrigger className="w-full glass-input">
                  <SelectValue placeholder="Elige tu carrera..." />
                </SelectTrigger>
                <SelectContent className="glass-select">
                  {careers.map((career) => (
                    <SelectItem key={career.id} value={career.name}>
                      {career.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCareer && (
              <div>
                <label className="text-sm font-medium text-purple-200 mb-2 block">Buscar Materia</label>
                <div className="relative">
                  <Input
                    placeholder="Escribe para buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full glass-input pl-10"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-purple-300" />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              variant={viewMode === ExamViewMode.List ? "default" : "outline"}
              onClick={() => setViewMode(ExamViewMode.List)}
              className={
                viewMode === ExamViewMode.List
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-transparent border-purple-500/30 text-white hover:bg-purple-800/30"
              }
            >
              <List className="h-5 w-5 mr-2" />
              Vista de Cuadrícula
            </Button>
            <Button
              variant={viewMode === ExamViewMode.Table ? "default" : "outline"}
              onClick={() => setViewMode(ExamViewMode.Table)}
              className={
                viewMode === ExamViewMode.Table
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-transparent border-purple-500/30 text-white hover:bg-purple-800/30"
              }
            >
              <TableIcon className="h-5 w-5 mr-2" />
              Vista de Tabla
            </Button>
          </div>
        </div>

        {!selectedCareer && (
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-purple-300">
              <BookOpen className="w-16 h-16" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Selecciona una Carrera</h2>
            <p className="text-purple-200">
              Elige una carrera de ingeniería del menú desplegable para ver todas las materias y cursos específicos de
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
                        <Card className="glass-card h-full">
                          <CardContent className="p-4 flex flex-col justify-between h-full">
                            <div>
                              <Badge
                                variant={BadgeVariant.Secondary}
                                className="mb-2 bg-purple-500/20 text-purple-300 border-purple-500/30"
                              >
                                {table}
                              </Badge>
                              <h3
                                className="font-bold text-white truncate whitespace-nowrap overflow-hidden min-w-0"
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
                      className="col-span-full text-center glass-card p-8"
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
                className="glass-card p-4"
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
                                  <Card className="glass-card h-full">
                                    <CardContent className="p-4 flex flex-col justify-between h-full">
                                      <h3
                                        className="font-bold text-white truncate whitespace-nowrap overflow-hidden min-w-0"
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
                                className="col-span-full text-center p-8"
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
    </AuroraBackground>
  )
}
