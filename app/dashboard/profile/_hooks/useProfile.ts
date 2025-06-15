"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/stores/useAuthStore"
import { getSupabaseBrowserClient } from "@/lib/supabase"

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

interface UserSubject {
  id: number
  user_id: string
  subject_id: number
  status: string
  grade: number | null
  created_at: string
  updated_at: string
  subjects: {
    name: string
  } | null
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

  const fetchProfileData = async () => {
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
          .select(`
            id,
            user_id,
            subject_id,
            status,
            grade,
            created_at,
            updated_at,
            subjects (
              name
            )
          `)
          .eq("user_id", user.id)
          .eq("status", "PROMOCIONADO")
          .not("grade", "is", null)
      ])

      if (profileResponse.error) throw profileResponse.error
      if (careersResponse.error) throw careersResponse.error
      if (gradesResponse.error) throw gradesResponse.error

      setProfile(profileResponse.data)
      setCareers(careersResponse.data || [])

      const approvedWithGrades = gradesResponse.data || []
      setApprovedSubjectsCount(approvedWithGrades.length)

      if (approvedWithGrades.length > 0) {
        const validGrades = approvedWithGrades.filter(subject => subject.grade !== null)
        if (validGrades.length > 0) {
          const totalGrades = validGrades.reduce((sum, subject) => sum + (subject.grade || 0), 0)
          const average = totalGrades / validGrades.length
          setAverageGrade(Number(average.toFixed(2)))
        } else {
          setAverageGrade(null)
        }
      } else {
        setAverageGrade(null)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos del perfil')
    } finally {
      setIsLoading(false)
    }
  }

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
  }, [user])

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