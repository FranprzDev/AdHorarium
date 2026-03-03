"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useCareerStore } from "@/stores/useCareerStore"

type Career = { id: number; name: string }
type ExamTable = "Mesa I" | "Mesa II" | "Mesa III"
type TransformedData = {
  [key: string]: { "Mesa I": string[]; "Mesa II": string[]; "Mesa III": string[] }
}

export function useMesas() {
  const [allSubjectsData, setAllSubjectsData] = useState<TransformedData>({})
  const [careers, setCareers] = useState<Career[]>([])
  const [selectedCareer, setSelectedCareer] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const { selectedCareer: storeCareer } = useCareerStore()

  useEffect(() => {
    async function loadCareers() {
      setLoading(true)
      try {
        const res = await fetch("/api/careers")
        if (!res.ok) throw new Error("Error loading careers")
        const { careers: data } = await res.json()
        const allCareers: Career[] = data || []
        setCareers(allCareers)
        if (storeCareer) {
          const match = allCareers.find((c) => c.id === storeCareer.id)
          if (match) setSelectedCareer(match.name)
        }
      } catch (err) {
        console.error("Error loading careers:", err)
      } finally {
        setLoading(false)
      }
    }
    loadCareers()
  }, [storeCareer])

  const fetchSubjects = useCallback(
    async (targetCareerId: number | null) => {
      setLoading(true)
      try {
        const basicCareer = careers.find((c) => c.name.toLowerCase().includes("ciencias"))
        const careersToQuery = [...new Set([targetCareerId, basicCareer?.id])].filter(
          Boolean
        ) as number[]
        if (careersToQuery.length === 0) {
          setAllSubjectsData({})
          return
        }

        const res = await fetch(`/api/subjects/mesas?career_ids=${careersToQuery.join(",")}`)
        if (!res.ok) throw new Error("Error fetching subjects")
        const { subjects } = await res.json()

        const transformedData: TransformedData = {}
        for (const subject of subjects || []) {
          const careerName = subject.career_name
          if (!transformedData[careerName]) {
            transformedData[careerName] = { "Mesa I": [], "Mesa II": [], "Mesa III": [] }
          }
          if (subject.exam_table_id) {
            const examTableName: ExamTable =
              subject.exam_table_id === 1
                ? "Mesa I"
                : subject.exam_table_id === 2
                ? "Mesa II"
                : "Mesa III"
            transformedData[careerName][examTableName].push(subject.name)
          }
        }
        setAllSubjectsData(transformedData)
      } catch (err) {
        console.error("Error fetching subjects:", err)
      } finally {
        setLoading(false)
      }
    },
    [careers]
  )

  useEffect(() => {
    if (careers.length > 0) {
      const career = careers.find((c) => c.name === selectedCareer)
      fetchSubjects(career?.id ?? null)
    }
  }, [selectedCareer, careers, fetchSubjects])

  const careerSubjects = useMemo(() => {
    if (!selectedCareer || Object.keys(allSubjectsData).length === 0) return null
    const userCareerSubjects = allSubjectsData[selectedCareer] || {
      "Mesa I": [],
      "Mesa II": [],
      "Mesa III": [],
    }
    const basicSubjects = allSubjectsData["Ciencias Básicas"] || {
      "Mesa I": [],
      "Mesa II": [],
      "Mesa III": [],
    }
    return {
      "Mesa I": [...new Set([...userCareerSubjects["Mesa I"], ...basicSubjects["Mesa I"]])],
      "Mesa II": [...new Set([...userCareerSubjects["Mesa II"], ...basicSubjects["Mesa II"]])],
      "Mesa III": [...new Set([...userCareerSubjects["Mesa III"], ...basicSubjects["Mesa III"]])],
    }
  }, [selectedCareer, allSubjectsData])

  return { loading, careers, selectedCareer, setSelectedCareer, careerSubjects }
}
