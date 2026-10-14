"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuthStore } from "@/stores/useAuthStore"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { averageGrade as computeAverageGrade } from "@/lib/gpa"
import { LegacyUserSubjectStatus } from "@/types/enums"

interface Profile {
  id: string
  full_name: string
  avatar_url: string
  career_id: number | null
}

interface Career {
  id: number
  name: string
}

type PromotedGradeRow = {
  grade: number | null
}

interface UseProfileReturn {
  profile: Profile | null
  careers: Career[]
  averageGrade: number | null
  approvedSubjectsCount: number
  isLoading: boolean
  error: string | null
  handleCareerChange: (careerId: number) => Promise<void>
}

export function useProfile(): UseProfileReturn {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [careers, setCareers] = useState<Career[]>([])
  const [averageGrade, setAverageGrade] = useState<number | null>(null)
  const [approvedSubjectsCount, setApprovedSubjectsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = getSupabaseBrowserClient()

  const fetchProfileData = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      const [profileResponse, careersResponse, gradesResponse] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single(),
        
        supabase
          .from("careers")
          .select("id, name"),
        
        supabase
          .from("user_subjects")
          .select("grade")
          .eq("user_id", user.id)
          .eq("status", LegacyUserSubjectStatus.Promocionado)
          .not("grade", "is", null)
          .overrideTypes<PromotedGradeRow[], { merge: false }>()
      ])

      if (profileResponse.error) throw profileResponse.error
      if (careersResponse.error) throw careersResponse.error
      if (gradesResponse.error) throw gradesResponse.error

      setProfile(profileResponse.data)
      setCareers(careersResponse.data || [])

      const grades: number[] = []
      for (const row of gradesResponse.data ?? []) {
        if (row.grade !== null) grades.push(row.grade)
      }
      setApprovedSubjectsCount(grades.length)
      setAverageGrade(computeAverageGrade(grades))

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos del perfil')
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  const handleCareerChange = async (careerId: number) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ career_id: careerId })
        .eq("id", user.id)

      if (error) throw error

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la carrera')
    }
  }

  useEffect(() => {
    fetchProfileData()
  }, [fetchProfileData])

  return {
    profile,
    careers,
    averageGrade,
    approvedSubjectsCount,
    isLoading,
    error,
    handleCareerChange
  }
} 