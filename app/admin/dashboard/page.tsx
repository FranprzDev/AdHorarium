"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { BookOpen, Users, LinkIcon, GraduationCap, TrendingUp, Database } from "lucide-react"

interface DashboardStats {
  totalSubjects: number
  totalCorrelatives: number
  totalCareers: number
  subjectsByCareer: { career_name: string; count: number }[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSubjects: 0,
    totalCorrelatives: 0,
    totalCareers: 0,
    subjectsByCareer: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get total subjects
        const { count: subjectsCount } = await supabase.from("subjects").select("*", { count: "exact", head: true })

        // Get total correlatives
        const { count: correlativesCount } = await supabase
          .from("subject_correlatives")
          .select("*", { count: "exact", head: true })

        // Get total careers
        const { count: careersCount } = await supabase.from("careers").select("*", { count: "exact", head: true })

        // Get subjects by career
        const { data: subjectsByCareer } = await supabase.from("complete_subjects_info").select("career_name")

        const careerCounts =
          subjectsByCareer?.reduce((acc: Record<string, number>, subject) => {
            acc[subject.career_name] = (acc[subject.career_name] || 0) + 1
            return acc
          }, {}) || {}

        const subjectsByCareerArray = Object.entries(careerCounts).map(([career_name, count]) => ({
          career_name,
          count: count as number,
        }))

        setStats({
          totalSubjects: subjectsCount || 0,
          totalCorrelatives: correlativesCount || 0,
          totalCareers: careersCount || 0,
          subjectsByCareer: subjectsByCareerArray,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold gradient-text">Panel de Administración</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass-card animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-purple-300/20 rounded w-20"></div>
                <div className="h-4 w-4 bg-purple-300/20 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-purple-300/20 rounded w-16 mb-2"></div>
                <div className="h-3 bg-purple-300/20 rounded w-24"></div>
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
        <h1 className="text-3xl font-bold gradient-text">Panel de Administración</h1>
        <Badge variant="outline" className="border-purple-500/30 text-purple-300">
          <Database className="h-4 w-4 mr-2" />
          Sistema Activo
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-200">Total Materias</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalSubjects}</div>
            <p className="text-xs text-purple-300">Materias registradas</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-200">Correlativas</CardTitle>
            <LinkIcon className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalCorrelatives}</div>
            <p className="text-xs text-purple-300">Relaciones creadas</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-200">Carreras</CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalCareers}</div>
            <p className="text-xs text-purple-300">Carreras disponibles</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-200">Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalCareers > 0 ? Math.round(stats.totalSubjects / stats.totalCareers) : 0}
            </div>
            <p className="text-xs text-purple-300">Materias por carrera</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-300" />
              Distribución por Carrera
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.subjectsByCareer.map((career, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-purple-200 text-sm">{career.career_name}</span>
                  <Badge variant="secondary" className="bg-purple-600/20 text-purple-300">
                    {career.count} materias
                  </Badge>
                </div>
              ))}
              {stats.subjectsByCareer.length === 0 && (
                <p className="text-purple-300 text-center py-4">No hay datos disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-300" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-purple-600/10 border border-purple-500/20">
                <h4 className="font-medium text-white mb-1">Gestión de Materias</h4>
                <p className="text-sm text-purple-300">Crear, editar y eliminar materias del sistema</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-600/10 border border-purple-500/20">
                <h4 className="font-medium text-white mb-1">Configurar Correlativas</h4>
                <p className="text-sm text-purple-300">Establecer relaciones entre materias</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-600/10 border border-purple-500/20">
                <h4 className="font-medium text-white mb-1">Monitoreo del Sistema</h4>
                <p className="text-sm text-purple-300">Revisar estadísticas y rendimiento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
