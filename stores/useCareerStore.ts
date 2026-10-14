import { create } from "zustand"
import { getCareersAction } from "@/app/actions/catalog"
import type { Career } from "@/types/types"

interface CareerState {
  careers: Career[]
  selectedCareer: Career | null
  isLoading: boolean
  error: string | null
  fetchCareers: (preferredCareerId?: number | null) => Promise<void>
  selectCareer: (career: Career | null) => void
  selectCareerById: (careerId: number) => void
}

export const useCareerStore = create<CareerState>((set, get) => ({
  careers: [],
  selectedCareer: null,
  isLoading: true,
  error: null,
  fetchCareers: async (preferredCareerId = null) => {
    set({ isLoading: true, error: null })
    const result = await getCareersAction()
    if (!result.ok) {
      set({ careers: [], isLoading: false, error: result.error })
      return
    }
    const careers = result.data
    const current = get().selectedCareer
    const preferred = careers.find((career) => career.id === preferredCareerId)
    const kept = careers.find((career) => career.id === current?.id)
    set({ careers, isLoading: false, selectedCareer: preferred ?? kept ?? careers[0] ?? null })
  },
  selectCareer: (career) => set({ selectedCareer: career }),
  selectCareerById: (careerId) => {
    const career = get().careers.find((item) => item.id === careerId)
    if (career) set({ selectedCareer: career })
  },
}))
