"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/utils/supabase/client"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, List, TableIcon, BookOpen } from "lucide-react"

type ViewMode = "list" | "table"
type ExamTable = "Mesa I" | "Mesa II" | "Mesa III"
type Career = { id: number; name: string }
type Subject = { name: string; career_id: number; exam_table_id: number; careers: { name: string } }
type TransformedData = {
  [key: string]: {
    "Mesa I": string[]
    "Mesa II": string[]
    "Mesa III": string[]
  }
}

export default function MesasPage() {
  const [allSubjectsData, setAllSubjectsData] = useState<TransformedData>({})
  const [careers, setCareers] = useState<Career[]>([])
  const [selectedCareer, setSelectedCareer] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [activeTab, setActiveTab] = useState<ExamTable>("Mesa I")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const { data: careersData } = await supabase.from("careers").select("id, name")
      setCareers(careersData || [])

      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("name, career_id, exam_table_id, careers(name)")
      
      const transformedData: TransformedData = {}
      if (subjectsData) {
        subjectsData.forEach((subject: any) => {
          const careerName = subject.careers.name
          if (!transformedData[careerName]) {
            transformedData[careerName] = { "Mesa I": [], "Mesa II": [], "Mesa III": [] }
          }
          if (subject.exam_table_id) {
            const examTableName: ExamTable =
              subject.exam_table_id === 1 ? "Mesa I" : subject.exam_table_id === 2 ? "Mesa II" : "Mesa III"
            transformedData[careerName][examTableName].push(subject.name)
          }
        })
      }
      setAllSubjectsData(transformedData)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("careers(name)")
          .eq("id", user.id)
          .single()
        if (profile && profile.careers) {
          setSelectedCareer((profile.careers as any).name)
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const careerSubjects = useMemo(() => {
    if (!selectedCareer || Object.keys(allSubjectsData).length === 0) return null

    const userCareerSubjects = allSubjectsData[selectedCareer] || { "Mesa I": [], "Mesa II": [], "Mesa III": [] }
    const basicSubjects = allSubjectsData["Ciencias Básicas"] || { "Mesa I": [], "Mesa II": [], "Mesa III": [] }

    const combined = {
      "Mesa I": [...new Set([...userCareerSubjects["Mesa I"], ...basicSubjects["Mesa I"]])],
      "Mesa II": [...new Set([...userCareerSubjects["Mesa II"], ...basicSubjects["Mesa II"]])],
      "Mesa III": [...new Set([...userCareerSubjects["Mesa III"], ...basicSubjects["Mesa III"]])],
    }

    return combined
  }, [selectedCareer, allSubjectsData])

  const filteredSubjects = useMemo(() => {
    if (!careerSubjects) return null

    if (!searchQuery.trim()) {
      return careerSubjects
    }

    const query = searchQuery.toLowerCase().trim()
    const result: typeof careerSubjects = { "Mesa I": [], "Mesa II": [], "Mesa III": [] }

    Object.entries(careerSubjects).forEach(([table, subjects]) => {
      result[table as ExamTable] = subjects.filter((subject) => subject.toLowerCase().includes(query))
    })

    return result
  }, [careerSubjects, searchQuery])

  const allSubjects = useMemo(() => {
    if (!filteredSubjects) return []
    return Object.entries(filteredSubjects).flatMap(([table, subjects]) =>
      subjects.map((subject) => ({ subject, table })),
    )
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
          Explora todas las materias y cursos específicos de tu carrera de ingeniería elegida
        </p>

        <div className="glass-card p-6 mb-8">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-purple-200 mb-2 block">Selecciona tu Carrera</label>
              <Select onValueChange={setSelectedCareer} value={selectedCareer}>
                <SelectTrigger className="w-full sm:w-64 glass-input mb-4">
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

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    onClick={() => setViewMode("list")}
                    className={
                      viewMode === "list"
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-transparent border-purple-500/30 text-white hover:bg-purple-800/30"
                    }
                  >
                    <List className="h-5 w-5 mr-2" />
                    Vista de Cuadrícula
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "outline"}
                    onClick={() => setViewMode("table")}
                    className={
                      viewMode === "table"
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-transparent border-purple-500/30 text-white hover:bg-purple-800/30"
                    }
                  >
                    <TableIcon className="h-5 w-5 mr-2" />
                    Vista de Tabla
                  </Button>
                </div>
              </div>
            </div>

            {selectedCareer && (
              <div>
                <label className="text-sm font-medium text-purple-200 mb-2 block">Buscar Materia</label>
                <div className="relative">
                  <Input
                    placeholder="Escribe para buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="glass-input pl-10"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-purple-300" />
                </div>
              </div>
            )}
          </div>
        </div>

        {!selectedCareer && (
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-purple-300">
              <BookOpen />
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
            {viewMode === "list" ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {allSubjects.length > 0 ? (
                  allSubjects.map(({ subject, table }, index) => (
                    <motion.div key={`${subject}-${index}`} variants={itemVariants}>
                      <Card className="glass-card hover:bg-white/15 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-white font-medium">{subject}</h3>
                            <Badge className="bg-purple-700/70 text-white shrink-0">{table}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full glass-card p-6 text-center">
                    <p className="text-purple-200">No se encontraron materias que coincidan con tu búsqueda.</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as ExamTable)}
                className="glass-card p-6"
              >
                <TabsList className="grid grid-cols-3 mb-6 bg-purple-900/30">
                  <TabsTrigger value="Mesa I" className="tab">
                    Mesa I
                  </TabsTrigger>
                  <TabsTrigger value="Mesa II" className="tab">
                    Mesa II
                  </TabsTrigger>
                  <TabsTrigger value="Mesa III" className="tab">
                    Mesa III
                  </TabsTrigger>
                </TabsList>

                {(["Mesa I", "Mesa II", "Mesa III"] as const).map((table) => (
                  <TabsContent key={table} value={table} className="space-y-4 mt-2">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={table}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {filteredSubjects[table].length > 0 ? (
                          <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                          >
                            {filteredSubjects[table].map((subject, index) => (
                              <motion.div key={`${subject}-${index}`} variants={itemVariants}>
                                <Card className="glass-card hover:bg-white/15 transition-colors">
                                  <CardContent className="p-4">
                                    <h3 className="text-white font-medium">{subject}</h3>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </motion.div>
                        ) : (
                          <div className="glass-card p-6 text-center">
                            <p className="text-purple-200">
                              No hay materias en esta mesa que coincidan con tu búsqueda.
                            </p>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </>
        )}
      </motion.div>
    </AuroraBackground>
  )
}
