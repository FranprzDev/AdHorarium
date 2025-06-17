"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useAuthStore } from "@/stores/useAuthStore"
import { useCareerStore } from "@/stores/useCareerStore"
import type { SubjectWithStatus, SubjectStatus } from "@/types/course"

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<SubjectWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isLoading: authLoading } = useAuthStore()
  const { selectedCareer, isLoading: careerLoading } = useCareerStore()
  const supabase = createClient()

  useEffect(() => {
    const fetchSubjects = async (careerId: number) => {
      try {
        setLoading(true)
        setError(null)
  
        if (!user) {
          setError("Usuario no autenticado")
          return
        }
  
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("subjects")
          .select("*, career_name:careers(name)")
          .or(`career_id.eq.${careerId},and(career_id.eq.6,typical_system_engineer.eq.true)`)
          .order("name")
  
        if (subjectsError) {
          setError(subjectsError.message)
          return
        }
  
        const { data: userSubjects, error: userSubjectsError } = await supabase
          .from("user_subjects")
          .select("*")
          .eq("user_id", user.id)
  
        if (userSubjectsError) {
          setError(userSubjectsError.message)
          return
        }
  
        const userSubjectsMap = new Map(
          userSubjects?.map((us) => [us.subject_id, us]) || []
        )
  
        const subjectsWithStatus: SubjectWithStatus[] = (subjectsData || []).map((subject) => {
          const userSubject = userSubjectsMap.get(subject.id)
          return {
            ...subject,
            career_name: subject.career_name?.name || "",
            status: userSubject?.status || "NO_CURSANDO",
            grade: userSubject?.grade,
          }
        })
  
        setSubjects(subjectsWithStatus)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    if (authLoading || careerLoading) return

    if (user && selectedCareer?.id) {
      fetchSubjects(selectedCareer.id)
    } else {
      setLoading(false)
    }
  }, [user, authLoading, selectedCareer, careerLoading, supabase])

  const updateSubjectStatus = async (
    subjectId: number,
    status: SubjectStatus,
    grade?: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: "Usuario no autenticado" }
      }

      const { error } = await supabase
        .from("user_subjects")
        .upsert(
          {
            user_id: user.id,
            subject_id: subjectId,
            status,
            grade: status === "PROMOCIONADO" ? grade : null,
          },
          { onConflict: "user_id,subject_id" }
        )

      if (error) {
        return { success: false, error: error.message }
      }

      setSubjects((prev) =>
        prev.map((subject) =>
          subject.id === subjectId
            ? { ...subject, status, grade: status === "PROMOCIONADO" ? grade : undefined }
            : subject
        )
      )

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      return { success: false, error: errorMessage }
    }
  }

  return {
    subjects,
    loading,
    error,
    updateSubjectStatus
  }
} 