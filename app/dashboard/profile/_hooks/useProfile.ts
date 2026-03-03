"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/stores/useAuthStore"

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

  const fetchProfileData = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      const [profileRes, careersRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/careers"),
      ])

      if (!profileRes.ok) throw new Error("Error al cargar el perfil")
      if (!careersRes.ok) throw new Error("Error al cargar las carreras")

      const profileData = await profileRes.json()
      const careersData = await careersRes.json()

      setProfile(profileData.profile)
      setCareers(careersData.careers || [])

      // Calculate stats from user-subjects
      const subjectsRes = await fetch("/api/user-subjects")
      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json()
        const promoted = (subjectsData.subjects || []).filter(
          (s: any) => s.status === "promocionada" && s.grade !== null
        )
        setApprovedSubjectsCount(promoted.length)
        if (promoted.length > 0) {
          const total = promoted.reduce((sum: number, s: any) => sum + (s.grade || 0), 0)
          setAverageGrade(Number((total / promoted.length).toFixed(2)))
        } else {
          setAverageGrade(null)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los datos del perfil")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCareerChange = async (careerId: number) => {
    if (!user) return
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ career_id: careerId }),
      })
      if (!res.ok) throw new Error("Error al actualizar la carrera")
      const data = await res.json()
      setProfile(data.profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar la carrera")
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
    handleCareerChange,
  }
}
