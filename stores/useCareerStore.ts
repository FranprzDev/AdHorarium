import { create } from 'zustand'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { Career } from '@/types/types'

interface CareerState {
  careers: Career[]
  careerNames: Record<string, string>
  selectedCareer: Career | null
  isLoading: boolean
  fetchCareers: () => Promise<void>
  selectCareer: (career: Career | null) => void
}

export const useCareerStore = create<CareerState>((set, get) => ({
  careers: [],
  careerNames: {},
  selectedCareer: null,
  isLoading: true,
  fetchCareers: async () => {
    set({ isLoading: true })
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('careers')
      .select('*')
      
    if (error) {
      console.error('Error fetching careers:', error)
      set({ careers: [], isLoading: false })
    } else {
      const allCareers = data || []
      const filteredCareers = allCareers.filter(c => c.code !== 'CB')
      
      const careerNameMap = allCareers.reduce((acc, career) => {
        acc[career.code] = career.name
        return acc
      }, {} as Record<string, string>)

      set({ 
        careers: filteredCareers, 
        careerNames: careerNameMap,
        isLoading: false 
      })

      if (filteredCareers.length > 0 && !get().selectedCareer) {
        set({ selectedCareer: filteredCareers[0] })
      }
    }
  },
  selectCareer: (career) => set({ selectedCareer: career }),
})) 