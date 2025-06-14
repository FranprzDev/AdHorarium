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
  const { user } = useAuthStore()
  const { careerId } = useCareerStore()
  const supabase = createClient()

  useEffect(() => {
    if (user && careerId) {
      console.log("Fetching subjects...")
      fetchSubjects()
    }
  }, [user?.id, careerId])

  const fetchSubjects = async () => {
    if (!user || !careerId) return
    
    setLoading(true)
    setError(null)

    try {
      console.log("Fetching subjects...")
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select(`
          *,
          career_name:careers(name),
          user_subjects!subjects_user_subjects_subject_id_fkey(
            status,
            grade
          )
        `)
        .or(`career_id.eq.${careerId},and(career_id.eq.6,typical_system_engineer.eq.true)`)
        .eq('user_subjects.user_id', user.id)
        .order("name")

      console.log("Raw data:", subjectsData)

      if (subjectsError) {
        console.error("Supabase error:", subjectsError)
        throw subjectsError
      }

      const subjectsWithStatus = (subjectsData || []).map((subject: any) => {
        const userSubject = subject.user_subjects?.[0]
        console.log(`${subject.name}: userSubject =`, userSubject)
        return {
          ...subject,
          career_name: subject.career_name?.name || "",
          status: userSubject?.status || "NO_CURSANDO",
          grade: userSubject?.grade,
          user_subjects: undefined,
        }
      })

      console.log("Final subjects:", subjectsWithStatus)
      setSubjects(subjectsWithStatus)
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

      if (error) return { success: false, error: error.message }

      setSubjects(prev =>
        prev.map(subject =>
          subject.id === subjectId
            ? { ...subject, status, grade: status === "PROMOCIONADO" ? grade : undefined }
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