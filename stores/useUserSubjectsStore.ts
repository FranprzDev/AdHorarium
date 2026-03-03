import { create } from 'zustand'
import { AuthUser } from '@/stores/useAuthStore'

export type SubjectStatus = "promocionada" | "regular" | "cursando" | "no_cursada"

type UserSubjectState = {
  status: SubjectStatus
  grade: number | null
}

type UserSubjectsState = {
  userSubjects: Record<number, UserSubjectState>
  isLoading: boolean
  fetchUserSubjects: (user: AuthUser, career_code: string) => Promise<void>
  updateUserSubjectState: (
    user: AuthUser,
    career_code: string,
    subject_number: number,
    status: SubjectStatus,
    grade?: number | null
  ) => Promise<void>
}

export const useUserSubjectsStore = create<UserSubjectsState>((set, get) => ({
  userSubjects: {},
  isLoading: true,

  fetchUserSubjects: async (user, career_code) => {
    if (!user || !career_code) return
    set({ isLoading: true })
    try {
      const res = await fetch(
        `/api/user-subjects?userId=${user.id}&career_code=${career_code}`
      )
      if (!res.ok) throw new Error('Error fetching user subjects')
      const { subjects } = await res.json()

      const userSubjectsMap = (subjects || []).reduce(
        (acc: Record<number, UserSubjectState>, s: any) => {
          acc[s.subject_number] = { status: s.status, grade: s.grade }
          return acc
        },
        {} as Record<number, UserSubjectState>
      )

      set({ userSubjects: userSubjectsMap })
    } catch (error) {
      console.error('Error fetching user subjects:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  updateUserSubjectState: async (user, career_code, subject_number, status, grade = null) => {
    if (!user || !career_code) return
    try {
      const res = await fetch('/api/user-subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, career_code, subject_number, status, grade }),
      })
      if (!res.ok) throw new Error('Error updating user subject')
      get().fetchUserSubjects(user, career_code)
    } catch (error) {
      console.error('Error updating user subject state:', error)
    }
  },
}))
