import { create } from 'zustand'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { Career } from '@/types/types'

interface CareerState {
  careers: Career[]
  selectedCareer: Career | null
  isLoading: boolean
  fetchCareers: () => Promise<void>
  selectCareer: (career: Career | null) => void
}

export const useCareerStore = create<CareerState>((set, get) => ({
  careers: [],
  selectedCareer: null,
  isLoading: true,
  fetchCareers: async () => {
    set({ isLoading: true })
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('careers')
      .select('*')
      .neq('code', 'CB') // Excluir Ciencias Básicas
    
    if (error) {
      console.error('Error fetching careers:', error)
      set({ careers: [], isLoading: false })
    } else {
      const careers = data || []
      set({ careers, isLoading: false })
      if (careers.length > 0 && !get().selectedCareer) {
        set({ selectedCareer: careers[0] })
      }
    }
  },
  selectCareer: (career) => set({ selectedCareer: career }),
})) 