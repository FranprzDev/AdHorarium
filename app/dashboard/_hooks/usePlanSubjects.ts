import { useEffect, useState } from "react"
import { getPlanSubjectsAction } from "@/app/actions/catalog"
import type { PlanSubject } from "@/types/types"

export function usePlanSubjects(careerId: number | null) {
  const [subjects, setSubjects] = useState<PlanSubject[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (careerId === null) {
      setSubjects([])
      return
    }
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      setError(null)
      const result = await getPlanSubjectsAction(careerId)
      if (cancelled) return
      if (result.ok) setSubjects(result.data)
      else {
        setSubjects([])
        setError(result.error)
      }
      setIsLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [careerId])

  return { subjects, isLoading, error }
}
