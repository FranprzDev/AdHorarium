import { create, StateCreator } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase'

type AuthState = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (provider: 'google') => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  init: () => () => void // Returns the unsubscribe function
}

const authStoreCreator: StateCreator<AuthState> = (set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  
  init: () => {
    const supabase = getSupabaseBrowserClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, isLoading: false })
    })
    
    // Initial fetch
    get().refreshSession()
    
    return subscription.unsubscribe
  },

  refreshSession: async () => {
    const supabase = getSupabaseBrowserClient()
    set({ isLoading: true })
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) throw error

      if (session) {
        set({ session, user: session.user })
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
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
      // isLoading will be set to false by onAuthStateChange listener
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

export const useAuthStore = create<AuthState>(authStoreCreator) 