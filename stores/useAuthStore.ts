import { create, StateCreator } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase'

type AuthState = {
  user: User | null
  session: Session | null
  careerId: number | null
  isLoading: boolean
  signIn: (provider: 'google') => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const authStoreCreator: StateCreator<AuthState> = (set, get) => ({
  user: null,
  session: null,
  careerId: null,
  isLoading: true,

  refreshSession: async () => {
    const supabase = getSupabaseBrowserClient()
    const { user } = get()
    if (!user) {
      set({ isLoading: false })
      return
    }

    set({ isLoading: true })
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('career_id')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching career_id:', error)
        set({ careerId: null })
      } else {
        set({ careerId: profile?.career_id ?? null })
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
      set({ careerId: null })
    } finally {
      set({ isLoading: false })
    }
  },

  signIn: async (provider: 'google') => {
    const supabase = getSupabaseBrowserClient()
    set({ isLoading: true })
    const REDIRECT_URL = 'https://v0-web-app-with-gsap-ztvhv0.vercel.app/dashboard'
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: REDIRECT_URL,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (error) {
          console.error('Error signing in:', error.message)
          alert(`Error signing in: ${error.message}`)
      }
    } catch (error) {
      console.error('Unexpected error during sign in:', error)
      alert('An unexpected error occurred. Please try again later.')
    } finally {
      set({ isLoading: false })
    }
  },

  signOut: async () => {
    const supabase = getSupabaseBrowserClient()
    set({ isLoading: true })
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      set({ user: null, session: null, careerId: null })
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      set({ isLoading: false })
    }
  },
})

export const useAuthStore = create<AuthState>(authStoreCreator)

// Auto-inicialización del store
const supabase = getSupabaseBrowserClient()

// Obtener sesión inicial
supabase.auth.getSession().then(({ data: { session } }) => {
  useAuthStore.setState({ 
    session, 
    user: session?.user ?? null,
    isLoading: false 
  })
  
  if (session?.user) {
    useAuthStore.getState().refreshSession()
  }
})

// Escuchar cambios de autenticación
supabase.auth.onAuthStateChange(async (_event, session) => {
  useAuthStore.setState({ 
    session, 
    user: session?.user ?? null 
  })
  
  if (session?.user) {
    await useAuthStore.getState().refreshSession()
  } else {
    useAuthStore.setState({ 
      isLoading: false, 
      careerId: null 
    })
  }
}) 