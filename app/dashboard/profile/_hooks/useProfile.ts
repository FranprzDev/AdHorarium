"use client"

import { useCallback, useEffect, useState } from "react"
import { getCareersAction } from "@/app/actions/catalog"
import { getMyProfileAction, selectMyCareerAction } from "@/app/actions/student"
import type { StudentProfile } from "@/db/queries/student"
import type { Career } from "@/types/types"

interface UseProfileReturn {
  profile: StudentProfile | null
  careers: Career[]
  averageGrade: number | null
  approvedSubjectsCount: number
  isLoading: boolean
  error: string | null
  handleCareerChange: (careerId: number) => Promise<void>
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [careers, setCareers] = useState<Career[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfileData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const [profileResult, careersResult] = await Promise.all([getMyProfileAction(), getCareersAction()])
    if (!profileResult.ok) setError(profileResult.error)
    else if (!careersResult.ok) setError(careersResult.error)
    else {
      setProfile(profileResult.data)
      setCareers(careersResult.data)
    }
    setIsLoading(false)
  }, [])

  const handleCareerChange = async (careerId: number) => {
    const result = await selectMyCareerAction(careerId)
    if (!result.ok) {
      setError(result.error)
      return
    }
    await fetchProfileData()
  }

  useEffect(() => {
    void fetchProfileData()
  }, [fetchProfileData])

  return {
    profile,
    careers,
    averageGrade: profile?.averageGrade ?? null,
    approvedSubjectsCount: profile?.gradedSubjectsCount ?? 0,
    isLoading,
    error,
    handleCareerChange,
  }
}
