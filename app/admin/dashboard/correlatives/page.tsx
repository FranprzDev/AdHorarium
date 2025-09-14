"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Plus, LinkIcon, Trash2, Search, Filter, ArrowRight } from "lucide-react"
import { toast } from "sonner"

interface Subject {
  id: number
  subject_number: number
  name: string
  career_name: string
  level: number
}

interface Correlative {
  id: number
  subject_id: number
  prerequisite_id: number
  type: "must_approve" | "must_course"
  subject_name: string
  subject_number: number
  subject_career: string
  prerequisite_name: string
  prerequisite_number: number
  prerequisite_career: string
}

interface Career {
  id: number
  name: string
}

export default function CorrelativesManagement() {
  const [correlatives, setCorrelatives] = useState<Correlative[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [careers, setCareers] = useState<Career[]>([])
  const [filteredCorrelatives, setFilteredCorrelatives] = useState<Correlative[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCareer, setSelectedCareer] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [newCorrelative, setNewCorrelative] = useState({
    subject_id: "",
    prerequisite_id: "",
    type: "must_approve" as "must_approve" | "must_course",
  })

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchCorrelatives()
    fetchSubjects()
    fetchCareers()
  }, [])

  useEffect(() => {
    filterCorrelatives()
  }, [correlatives, searchTerm, selectedCareer, selectedType])

  const fetchCorrelatives = async () => {
    try {
      const { data, error } = await supabase
        .from("subject_correlatives")
        .select(`
          id,
          subject_id,
          prerequisite_id,
          type,
          subject:subjects!subject_correlatives_subject_id_fkey(
            subject_number,
            name,
            career:careers(name)
          ),
          prerequisite:subjects!subject_correlatives_prerequisite_id_fkey(
            subject_number,
            name,
            career:careers(name)
          )
        `)
        .order("subject_id")

      if (error) throw error

      const formattedData =
        data?.map((item: any) => ({
          id: item.id,
          subject_id: item.subject_id,
          prerequisite_id: item.prerequisite_id,
          type: item.type,
          subject_name: item.subject.name,
          subject_number: item.subject.subject_number,
          subject_career: item.subject.career.name,
          prerequisite_name: item.prerequisite.name,
          prerequisite_number: item.prerequisite.subject_number,
          prerequisite_career: item.prerequisite.career.name,
        })) || []

      setCorrelatives(formattedData)
    } catch (error) {
      console.error("Error fetching correlatives:", error)
      toast.error("Error al cargar las correlativas")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("complete_subjects_info")
        .select("*")
        .order("career_name")
        .order("level")
        .order("subject_number")

      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error("Error fetching subjects:", error)
    }
  }

  const fetchCareers = async () => {
    try {
      const { data, error } = await supabase.from("careers").select("*").order("name")
      if (error) throw error
      setCareers(data || [])
    } catch (error) {
      console.error("Error fetching careers:", error)
    }
  }

  const filterCorrelatives = () => {
    let filtered = correlatives

    if (searchTerm) {
      filtered = filtered.filter(
        (correlative) =>
          correlative.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          correlative.prerequisite_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          correlative.subject_number.toString().includes(searchTerm) ||
          correlative.prerequisite_number.toString().includes(searchTerm),
      )
    }

    if (selectedCareer !== "all") {
      const careerName = careers.find((c) => c.id.toString() === selectedCareer)?.name
      filtered = filtered.filter(
        (correlative) => correlative.subject_career === careerName || correlative.prerequisite_career === careerName,
      )
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((correlative) => correlative.type === selectedType)
    }

    setFilteredCorrelatives(filtered)
  }

  const handleCreateCorrelative = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newCorrelative.subject_id || !newCorrelative.prerequisite_id) {
      toast.error("Por favor selecciona ambas materias")
      return
    }

    if (newCorrelative.subject_id === newCorrelative.prerequisite_id) {
      toast.error("Una materia no puede ser correlativa de sí misma")
      return
    }

    try {
      const { error } = await supabase.from("subject_correlatives").insert([
        {
          subject_id: Number.parseInt(newCorrelative.subject_id),
          prerequisite_id: Number.parseInt(newCorrelative.prerequisite_id),
          type: newCorrelative.type,
        },
      ])

      if (error) throw error

      toast.success("Correlativa creada exitosamente")
      setIsCreateModalOpen(false)
      setNewCorrelative({ subject_id: "", prerequisite_id: "", type: "must_approve" })
      fetchCorrelatives()
    } catch (error: any) {
      console.error("Error creating correlative:", error)
      if (error.code === "23505") {
        toast.error("Esta correlativa ya existe")
      } else {
        toast.error("Error al crear la correlativa")
      }
    }
  }

  const handleDeleteCorrelative = async (id: number) => {
    try {
      const { error } = await supabase.from("subject_correlatives").delete().eq("id", id)

      if (error) throw error

      toast.success("Correlativa eliminada exitosamente")
      fetchCorrelatives()
    } catch (error) {
      console.error("Error deleting correlative:", error)
      toast.error("Error al eliminar la correlativa")
    }
  }

  const getTypeColor = (type: string) => {
    return type === "must_approve"
      ? "bg-red-500/20 text-red-300 border-red-500/30"
      : "bg-blue-500/20 text-blue-300 border-blue-500/30"
  }

  const getTypeLabel = (type: string) => {
    return type === "must_approve" ? "Debe Aprobar" : "Debe Cursar"
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold gradient-text">Gestión de Correlativas</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass-card animate-pulse">
              <CardHeader>
                <div className="h-4 bg-purple-300/20 rounded w-3/4"></div>
                <div className="h-3 bg-purple-300/20 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-purple-300/20 rounded w-full mb-2"></div>
                <div className="h-3 bg-purple-300/20 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold gradient-text">Gestión de Correlativas</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="primary-button flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Correlativa
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-purple-500/30 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="gradient-text">Crear Nueva Correlativa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCorrelative} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-purple-200">
                  Materia Principal
                </Label>
                <Select
                  value={newCorrelative.subject_id}
                  onValueChange={(value) => setNewCorrelative({ ...newCorrelative, subject_id: value })}
                >
                  <SelectTrigger className="bg-purple-900/30 border-purple-500/30 text-white">
                    <SelectValue placeholder="Seleccionar materia principal" />
                  </SelectTrigger>
                  <SelectContent className="bg-purple-900 border-purple-500/30 max-h-60">
                    {subjects.map((subject) => (
                      <SelectItem
                        key={subject.id}
                        value={subject.id.toString()}
                        className="text-white hover:bg-purple-700"
                      >
                        {subject.subject_number} - {subject.name} ({subject.career_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prerequisite" className="text-purple-200">
                  Materia Correlativa
                </Label>
                <Select
                  value={newCorrelative.prerequisite_id}
                  onValueChange={(value) => setNewCorrelative({ ...newCorrelative, prerequisite_id: value })}
                >
                  <SelectTrigger className="bg-purple-900/30 border-purple-500/30 text-white">
                    <SelectValue placeholder="Seleccionar materia correlativa" />
                  </SelectTrigger>
                  <SelectContent className="bg-purple-900 border-purple-500/30 max-h-60">
                    {subjects.map((subject) => (
                      <SelectItem
                        key={subject.id}
                        value={subject.id.toString()}
                        className="text-white hover:bg-purple-700"
                      >
                        {subject.subject_number} - {subject.name} ({subject.career_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-purple-200">
                  Tipo de Correlativa
                </Label>
                <Select
                  value={newCorrelative.type}
                  onValueChange={(value: "must_approve" | "must_course") =>
                    setNewCorrelative({ ...newCorrelative, type: value })
                  }
                >
                  <SelectTrigger className="bg-purple-900/30 border-purple-500/30 text-white">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-purple-900 border-purple-500/30">
                    <SelectItem value="must_approve" className="text-white hover:bg-purple-700">
                      Debe Aprobar
                    </SelectItem>
                    <SelectItem value="must_course" className="text-white hover:bg-purple-700">
                      Debe Cursar
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-purple-300"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="primary-button">
                  Crear Correlativa
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300" />
          <Input
            placeholder="Buscar correlativas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-purple-900/30 border-purple-500/30 text-white placeholder:text-purple-300"
          />
        </div>
        <Select value={selectedCareer} onValueChange={setSelectedCareer}>
          <SelectTrigger className="w-full sm:w-[200px] bg-purple-900/30 border-purple-500/30 text-white">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por carrera" />
          </SelectTrigger>
          <SelectContent className="bg-purple-900 border-purple-500/30">
            <SelectItem value="all" className="text-white hover:bg-purple-700">
              Todas las carreras
            </SelectItem>
            {careers.map((career) => (
              <SelectItem key={career.id} value={career.id.toString()} className="text-white hover:bg-purple-700">
                {career.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-[180px] bg-purple-900/30 border-purple-500/30 text-white">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent className="bg-purple-900 border-purple-500/30">
            <SelectItem value="all" className="text-white hover:bg-purple-700">
              Todos los tipos
            </SelectItem>
            <SelectItem value="must_approve" className="text-white hover:bg-purple-700">
              Debe Aprobar
            </SelectItem>
            <SelectItem value="must_course" className="text-white hover:bg-purple-700">
              Debe Cursar
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredCorrelatives.map((correlative) => (
          <Card key={correlative.id} className="glass-card hover:scale-105 transition-transform duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-purple-300" />
                  <CardTitle className="text-lg font-bold text-white">Correlativa</CardTitle>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass-card border-purple-500/30">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">¿Eliminar correlativa?</AlertDialogTitle>
                      <AlertDialogDescription className="text-purple-200">
                        Esta acción no se puede deshacer. Se eliminará la relación de correlativa entre estas materias.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-purple-900/30 border-purple-500/30 text-purple-300 hover:bg-purple-800/30">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteCorrelative(correlative.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <Badge className={`${getTypeColor(correlative.type)} w-fit`}>{getTypeLabel(correlative.type)}</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-purple-300">Para cursar:</span>
                  <span className="text-white font-medium">
                    {correlative.subject_number} - {correlative.subject_name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-purple-400">
                  <ArrowRight className="h-4 w-4" />
                  <span className="text-xs">{correlative.subject_career}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-purple-300">
                    Se debe {correlative.type === "must_approve" ? "aprobar" : "cursar"}:
                  </span>
                  <span className="text-white font-medium">
                    {correlative.prerequisite_number} - {correlative.prerequisite_name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-purple-400">
                  <ArrowRight className="h-4 w-4" />
                  <span className="text-xs">{correlative.prerequisite_career}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCorrelatives.length === 0 && !isLoading && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LinkIcon className="h-12 w-12 text-purple-300 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No se encontraron correlativas</h3>
            <p className="text-purple-300 text-center">
              {searchTerm || selectedCareer !== "all" || selectedType !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Comienza creando tu primera correlativa"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
