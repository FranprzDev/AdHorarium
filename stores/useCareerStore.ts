import { create, StateCreator } from 'zustand'
import { getSupabaseBrowserClient } from '@/lib/supabase'

type CareerState = {
  careerId: number | null
  isLoading: boolean
  fetchCareerId: (userId: string) => Promise<void>
  clearCareer: () => void
}

const careerStoreCreator: StateCreator<CareerState> = (set) => ({
  careerId: null,
  isLoading: true,
  fetchCareerId: async (userId: string) => {
    set({ isLoading: true })
    const supabase = getSupabaseBrowserClient()
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('career_id')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching career_id:', error)
        set({ careerId: null })
      } else {
        set({ careerId: profile?.career_id ?? null })
      }
    } catch (error) {
      console.error('Error in fetchCareerId:', error)
      set({ careerId: null })
    } finally {
      set({ isLoading: false })
    }
  },
  clearCareer: () => {
    set({ careerId: null, isLoading: false })
  },
})

export const useCareerStore = create<CareerState>()(careerStoreCreator) 