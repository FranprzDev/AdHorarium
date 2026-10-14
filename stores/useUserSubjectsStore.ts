import { create } from "zustand"
import { getMySubjectStatesAction, updateMySubjectStateAction } from "@/app/actions/student"
import type { SubjectStatus } from "@/types/enums"
import type { UserSubjectStates } from "@/types/types"

type UserSubjectsState = {
  userSubjects: UserSubjectStates
  isLoading: boolean
  error: string | null
  fetchUserSubjects: (careerId: number) => Promise<void>
  updateUserSubjectState: (careerId: number, subjectId: number, status: SubjectStatus, grade: number | null) => Promise<boolean>
  clear: () => void
}

export const useUserSubjectsStore = create<UserSubjectsState>((set, get) => ({
  userSubjects: {},
  isLoading: false,
  error: null,
  fetchUserSubjects: async (careerId) => {
    set({ isLoading: true, error: null })
    const result = await getMySubjectStatesAction(careerId)
    if (result.ok) set({ userSubjects: result.data, isLoading: false })
    else set({ isLoading: false, error: result.error })
  },
  updateUserSubjectState: async (careerId, subjectId, status, grade) => {
    const result = await updateMySubjectStateAction({ subjectId, status, grade })
    if (!result.ok) {
      set({ error: result.error })
      return false
    }
    await get().fetchUserSubjects(careerId)
    return true
  },
  clear: () => set({ userSubjects: {}, error: null }),
}))
