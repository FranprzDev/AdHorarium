import { create } from "zustand"
import { getMySubjectStatesAction, updateMySubjectStateAction } from "@/app/actions/student"
import type { ActionResult } from "@/lib/action-result"
import type { SubjectStatus } from "@/types/enums"
import type { UserSubjectStates } from "@/types/types"

type UserSubjectsState = {
  userSubjects: UserSubjectStates
  isLoading: boolean
  error: string | null
  fetchUserSubjects: (careerId: number) => Promise<void>
  /**
   * Applies the change optimistically and persists it. When the server rejects it, the previous
   * state of that subject is restored and the error is returned so the caller can tell the student.
   */
  updateUserSubjectState: (subjectId: number, status: SubjectStatus, grade: number | null) => Promise<ActionResult<null>>
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
  updateUserSubjectState: async (subjectId, status, grade) => {
    const previous = get().userSubjects[subjectId]
    set({ userSubjects: { ...get().userSubjects, [subjectId]: { status, grade } }, error: null })
    const result = await updateMySubjectStateAction({ subjectId, status, grade })
    if (!result.ok) {
      const reverted = { ...get().userSubjects }
      if (previous) reverted[subjectId] = previous
      else delete reverted[subjectId]
      set({ userSubjects: reverted, error: result.error })
    }
    return result
  },
  clear: () => set({ userSubjects: {}, error: null }),
}))
