"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
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
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Plus, Search, Trash2, BookOpen, Filter } from "lucide-react"
import { toast } from "sonner"

interface Subject {
  id: number
  subject_number: number
  name: string
  career_id: number
  level: number
  career_name?: string
}

interface Career {
  id: number
  name: string
}

export default function SubjectsManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [careers, setCareers] = useState<Career[]>([])
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCareer, setSelectedCareer] = useState<string>("all")
  const [newSubject, setNewSubject] = useState({
    subject_number: "",
    name: "",
    career_id: "",
    level: "",
  })

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchSubjects()
    fetchCareers()
  }, [])

  useEffect(() => {
    filterSubjects()
  }, [subjects, searchTerm, selectedCareer])

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("complete_subjects_info")
        .select("*")
        .order("career_name", { ascending: true })
        .order("level", { ascending: true })
        .order("subject_number", { ascending: true })

      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error("Error fetching subjects:", error)
      toast.error("Error al cargar las materias")
    } finally {
      setIsLoading(false)
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

  const filterSubjects = () => {
    let filtered = subjects

    if (searchTerm) {
      filtered = filtered.filter(
        (subject) =>
          subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subject.subject_number.toString().includes(searchTerm) ||
          subject.career_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCareer !== "all") {
      filtered = filtered.filter((subject) => subject.career_id.toString() === selectedCareer)
    }

    setFilteredSubjects(filtered)
  }

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newSubject.subject_number || !newSubject.name || !newSubject.career_id || !newSubject.level) {
      toast.error("Por favor completa todos los campos")
      return
    }

    try {
      const { error } = await supabase.from("subjects").insert([
        {
          subject_number: Number.parseInt(newSubject.subject_number),
          name: newSubject.name,
          career_id: Number.parseInt(newSubject.career_id),
          level: Number.parseInt(newSubject.level),
        },
      ])

      if (error) throw error

      toast.success("Materia creada exitosamente")
      setIsCreateModalOpen(false)
      setNewSubject({ subject_number: "", name: "", career_id: "", level: "" })
      fetchSubjects()
    } catch (error: any) {
      console.error("Error creating subject:", error)
      if (error.code === "23505") {
        toast.error("Ya existe una materia con ese número en la carrera seleccionada")
      } else {
        toast.error("Error al crear la materia")
      }
    }
  }

  const handleDeleteSubject = async (id: number) => {
    try {
      const { error } = await supabase.from("subjects").delete().eq("id", id)

      if (error) throw error

      toast.success("Materia eliminada exitosamente")
      fetchSubjects()
    } catch (error) {
      console.error("Error deleting subject:", error)
      toast.error("Error al eliminar la materia")
    }
  }

  const getLevelColor = (level: number) => {
    const colors = [
      "bg-red-500/20 text-red-300",
      "bg-orange-500/20 text-orange-300",
      "bg-yellow-500/20 text-yellow-300",
      "bg-green-500/20 text-green-300",
      "bg-blue-500/20 text-blue-300",
      "bg-purple-500/20 text-purple-300",
    ]
    return colors[level - 1] || "bg-gray-500/20 text-gray-300"
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold gradient-text">Gestión de Materias</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
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
        <h1 className="text-3xl font-bold gradient-text">Gestión de Materias</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="primary-button flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Materia
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-purple-500/30">
            <DialogHeader>
              <DialogTitle className="gradient-text">Crear Nueva Materia</DialogTitle>
              <DialogDescription className="text-purple-200">
                Completa la información para crear una nueva materia en el sistema.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject_number" className="text-purple-200">
                    Número de Materia
                  </Label>
                  <Input
                    id="subject_number"
                    type="number"
                    value={newSubject.subject_number}
                    onChange={(e) => setNewSubject({ ...newSubject, subject_number: e.target.value })}
                    className="bg-purple-900/30 border-purple-500/30 text-white"
                    placeholder="ej: 1001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level" className="text-purple-200">
                    Nivel
                  </Label>
                  <Select
                    value={newSubject.level}
                    onValueChange={(value) => setNewSubject({ ...newSubject, level: value })}
                  >
                    <SelectTrigger className="bg-purple-900/30 border-purple-500/30 text-white">
                      <SelectValue placeholder="Seleccionar nivel" />
                    </SelectTrigger>
                    <SelectContent className="bg-purple-900 border-purple-500/30">
                      {[1, 2, 3, 4, 5, 6].map((level) => (
                        <SelectItem key={level} value={level.toString()} className="text-white hover:bg-purple-700">
                          Nivel {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-purple-200">
                  Nombre de la Materia
                </Label>
                <Input
                  id="name"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="bg-purple-900/30 border-purple-500/30 text-white"
                  placeholder="ej: Análisis Matemático I"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="career" className="text-purple-200">
                  Carrera
                </Label>
                <Select
                  value={newSubject.career_id}
                  onValueChange={(value) => setNewSubject({ ...newSubject, career_id: value })}
                >
                  <SelectTrigger className="bg-purple-900/30 border-purple-500/30 text-white">
                    <SelectValue placeholder="Seleccionar carrera" />
                  </SelectTrigger>
                  <SelectContent className="bg-purple-900 border-purple-500/30">
                    {careers.map((career) => (
                      <SelectItem
                        key={career.id}
                        value={career.id.toString()}
                        className="text-white hover:bg-purple-700"
                      >
                        {career.name}
                      </SelectItem>
                    ))}
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
                  Crear Materia
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
            placeholder="Buscar materias..."
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSubjects.map((subject) => (
          <Card key={subject.id} className="glass-card hover:scale-105 transition-transform duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-300" />
                  <CardTitle className="text-lg font-bold text-white">{subject.subject_number}</CardTitle>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass-card border-purple-500/30">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">¿Eliminar materia?</AlertDialogTitle>
                      <AlertDialogDescription className="text-purple-200">
                        Esta acción no se puede deshacer. Se eliminará la materia "{subject.name}" y todas sus
                        correlativas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-purple-900/30 border-purple-500/30 text-purple-300 hover:bg-purple-800/30">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteSubject(subject.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <p className="text-sm text-purple-300">{subject.career_name}</p>
            </CardHeader>
            <CardContent>
              <h3 className="font-medium text-white mb-2">{subject.name}</h3>
              <div className="flex items-center justify-between">
                <Badge className={`${getLevelColor(subject.level)} border-0`}>Nivel {subject.level}</Badge>
                <span className="text-xs text-purple-400">ID: {subject.id}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSubjects.length === 0 && !isLoading && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-purple-300 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No se encontraron materias</h3>
            <p className="text-purple-300 text-center">
              {searchTerm || selectedCareer !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Comienza creando tu primera materia"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
