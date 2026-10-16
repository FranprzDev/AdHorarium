"use client"

import { useEffect, useState } from "react"
import { getSubjectsByExamTableAction } from "@/app/actions/catalog"
import { getMyCareerIdAction } from "@/app/actions/student"
import { useCareerStore } from "@/stores/useCareerStore"
import type { SubjectsByExamTable } from "@/lib/exam-tables"

export function useMesas() {
  const { careers, selectedCareer: storeCareer, fetchCareers, isLoading: careersLoading } = useCareerStore()
  const [selectedCareer, setSelectedCareer] = useState<string>("")
  const [careerSubjects, setCareerSubjects] = useState<SubjectsByExamTable | null>(null)
  const [subjectsLoading, setSubjectsLoading] = useState(false)

  useEffect(() => {
    if (careers.length > 0) return
    const load = async () => {
      const myCareer = await getMyCareerIdAction()
      await fetchCareers(myCareer.ok ? myCareer.data : null)
    }
    void load()
  }, [careers.length, fetchCareers])

  useEffect(() => {
    if (!selectedCareer && storeCareer) setSelectedCareer(storeCareer.code)
  }, [selectedCareer, storeCareer])

  useEffect(() => {
    const career = careers.find((item) => item.code === selectedCareer)
    if (!career) {
      setCareerSubjects(null)
      return
    }
    let cancelled = false
    const load = async () => {
      setSubjectsLoading(true)
      const result = await getSubjectsByExamTableAction(career.id)
      if (cancelled) return
      if (result.ok) setCareerSubjects(result.data)
      else {
        console.error("Error cargando materias:", result.error)
        setCareerSubjects(null)
      }
      setSubjectsLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [careers, selectedCareer])

  return {
    loading: careersLoading || subjectsLoading,
    careers,
    selectedCareer,
    setSelectedCareer,
    careerSubjects,
  }
}
