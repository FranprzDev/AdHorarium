"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import { useCareerStore } from "@/stores/useCareerStore"

type Career = { id: number; name: string }
type ExamTable = "Mesa I" | "Mesa II" | "Mesa III"

type TransformedData = {
  [key: string]: {
    "Mesa I": string[]
    "Mesa II": string[]
    "Mesa III": string[]
  }
}

export function useMesas() {
  const [allSubjectsData, setAllSubjectsData] = useState<TransformedData>({})
  const [careers, setCareers] = useState<Career[]>([])
  const [selectedCareer, setSelectedCareer] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { careerId } = useCareerStore()

  const fetchSubjects = useCallback(
    async (targetCareerId: number | null) => {
      setLoading(true)

      const basicCareer = careers.find((c) => c.name.toLowerCase().includes("ciencias"))
      const basicCareerId = basicCareer ? basicCareer.id : null
      const careersToQuery = [...new Set([targetCareerId, basicCareerId])].filter(Boolean) as number[]

      if (careersToQuery.length === 0) {
        setAllSubjectsData({})
        setLoading(false)
        return
      }

      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("name, career_id, exam_table_id, careers(name)")
        .in("career_id", careersToQuery)

      if (subjectsError) {
        console.error("Error cargando materias:", subjectsError)
        setAllSubjectsData({})
        setLoading(false)
        return
      }

      const transformedData: TransformedData = {}
      if (subjectsData) {
        subjectsData.forEach((subject: any) => {
          const careerName = subject.careers.name
          if (!transformedData[careerName]) {
            transformedData[careerName] = { "Mesa I": [], "Mesa II": [], "Mesa III": [] }
          }
          if (subject.exam_table_id) {
            const examTableName: ExamTable =
              subject.exam_table_id === 1 ? "Mesa I" : subject.exam_table_id === 2 ? "Mesa II" : "Mesa III"
            transformedData[careerName][examTableName].push(subject.name)
          }
        })
      }
      setAllSubjectsData(transformedData)
      setLoading(false)
    },
    [supabase, careers],
  )

  useEffect(() => {
    const fetchCareers = async () => {
      setLoading(true)
      const { data: careersData, error: careersError } = await supabase.from("careers").select("id, name")
      if (careersError) {
        console.error("Error cargando carreras:", careersError)
        setLoading(false)
        return
      }
      const allCareers = careersData || []
      setCareers(allCareers)

      const initialCareer = allCareers.find((c) => c.id === careerId)
      if (initialCareer) {
        setSelectedCareer(initialCareer.name)
      }
      setLoading(false)
    }

    fetchCareers()
  }, [careerId, supabase])

  useEffect(() => {
    if (selectedCareer && careers.length > 0) {
      const career = careers.find((c) => c.name === selectedCareer)
      fetchSubjects(career?.id ?? null)
    } else if (!selectedCareer && careers.length > 0) {
      fetchSubjects(null)
    }
  }, [selectedCareer, careers, fetchSubjects])

  const careerSubjects = useMemo(() => {
    if (!selectedCareer || Object.keys(allSubjectsData).length === 0) return null

    const userCareerSubjects = allSubjectsData[selectedCareer] || { "Mesa I": [], "Mesa II": [], "Mesa III": [] }
    const basicSubjects = allSubjectsData["Ciencias Básicas"] || { "Mesa I": [], "Mesa II": [], "Mesa III": [] }

    return {
      "Mesa I": [...new Set([...userCareerSubjects["Mesa I"], ...basicSubjects["Mesa I"]])],
      "Mesa II": [...new Set([...userCareerSubjects["Mesa II"], ...basicSubjects["Mesa II"]])],
      "Mesa III": [...new Set([...userCareerSubjects["Mesa III"], ...basicSubjects["Mesa III"]])],
    }
  }, [selectedCareer, allSubjectsData])

  return {
    loading,
    careers,
    selectedCareer,
    setSelectedCareer,
    careerSubjects,
  }
} 