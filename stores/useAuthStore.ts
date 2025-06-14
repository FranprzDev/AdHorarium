import { create, StateCreator } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase'

type AuthState = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (provider: 'google') => Promise<void>
  signOut: () => Promise<void>
}

const authStoreCreator: StateCreator<AuthState> = (set) => ({
  user: null,
  session: null,
  isLoading: true,

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
      set({ user: null, session: null })
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      set({ isLoading: false })
    }
  },
})

export const useAuthStore = create<AuthState>()(
  persist(
    authStoreCreator,
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
)

if (typeof window !== 'undefined') {
  const supabase = getSupabaseBrowserClient()
  
  supabase.auth.getSession().then(({ data: { session } }) => {
    const currentState = useAuthStore.getState()
    
    if (session && !currentState.user) {
      useAuthStore.setState({ 
        session, 
        user: session.user,
        isLoading: false 
      })
    } 
    else if (!session && currentState.user) {
      useAuthStore.setState({ 
        user: null, 
        session: null, 
        isLoading: false 
      })
    }
    // Si ambos coinciden, solo actualizar isLoading
    else {
      useAuthStore.setState({ isLoading: false })
    }
  })
  
  // Escuchar cambios de autenticación
  supabase.auth.onAuthStateChange(async (_event, session) => {
    useAuthStore.setState({ 
      session, 
      user: session?.user ?? null,
      isLoading: false
    })
  })
} 