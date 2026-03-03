"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/stores/useAuthStore"
import { useCareerStore } from "@/stores/useCareerStore"
import type { SubjectWithStatus, SubjectStatus } from "@/types/course"

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<SubjectWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthStore()
  const { careerId } = useCareerStore()

  useEffect(() => {
    if (user && careerId) {
      fetchSubjects()
    }
  }, [user?.id, careerId])

  const fetchSubjects = async () => {
    if (!user || !careerId) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/subjects?careerId=${careerId}`)
      if (!res.ok) throw new Error("Error al cargar materias")
      const data = await res.json()
      setSubjects(data.subjects || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar materias")
    } finally {
      setLoading(false)
    }
  }

  const updateSubjectStatus = async (
    subjectId: number,
    status: SubjectStatus,
    grade?: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "Usuario no autenticado" }

    try {
      const res = await fetch("/api/user-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, status, grade: status === "promocionada" ? grade : null }),
      })

      if (!res.ok) {
        const data = await res.json()
        return { success: false, error: data.error || "Error al actualizar" }
      }

      setSubjects(prev =>
        prev.map(subject =>
          subject.id === subjectId
            ? { ...subject, status, grade: status === "promocionada" ? grade : undefined }
            : subject
        )
      )

      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Error desconocido" }
    }
  }

  return { subjects, loading, error, updateSubjectStatus }
}
