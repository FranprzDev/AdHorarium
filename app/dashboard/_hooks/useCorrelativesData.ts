import { useState, useEffect, useCallback } from 'react'
import { useCareerStore } from '@/stores/useCareerStore'

export function useCorrelativesData(careerCode?: string) {
  const [subjects, setSubjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (code: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/subjects?career_code=${code}`)
      if (!res.ok) throw new Error('Error fetching subjects')
      const { subjects: data } = await res.json()
      setSubjects(data || [])
    } catch (e: any) {
      setError(e.message)
      setSubjects([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (careerCode) {
      fetchData(careerCode)
    } else {
      setSubjects([])
    }
  }, [careerCode, fetchData])

  return { subjects, isLoading, error }
}
