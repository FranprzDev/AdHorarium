"use client"

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  
  // Actions
  signIn: (provider: 'google') => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (isLoading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        session: null,
        isLoading: true,

        setUser: (user: User | null) => set({ user }),
        setSession: (session: Session | null) => set({ session }),
        setLoading: (isLoading: boolean) => set({ isLoading }),

        refreshSession: async () => {
          try {
            set({ isLoading: true })
            const supabase = getSupabaseBrowserClient()
            
            const {
              data: { session },
              error,
            } = await supabase.auth.getSession()

            if (error) {
              throw error
            }

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
          try {
            set({ isLoading: true })
            const supabase = getSupabaseBrowserClient()
            
            // Función mejorada para determinar la URL de redirección
            const getRedirectUrl = () => {
              if (typeof window === 'undefined') {
                // Server-side fallback
                return 'http://localhost:3000/auth/callback'
              }
              
              const { protocol, hostname, port } = window.location
              
              // Para desarrollo local
              if (hostname === 'localhost' || hostname === '127.0.0.1') {
                const portSuffix = port ? `:${port}` : ''
                return `${protocol}//${hostname}${portSuffix}/auth/callback`
              }
              
              // Para producción y otros entornos
              return `${protocol}//${hostname}/auth/callback`
            }
            
            const redirectUrl = getRedirectUrl()
            console.log('Redirect URL:', redirectUrl)
            
            const { data, error } = await supabase.auth.signInWithOAuth({
              provider,
              options: {
                redirectTo: redirectUrl,
                queryParams: {
                  access_type: 'offline',
                  prompt: 'consent',
                },
              },
            })

            if (error) {
              console.error('Supabase auth error:', error)
              if (error.message.includes('provider is not enabled')) {
                alert('Google authentication is not enabled. Please contact the administrator.')
              } else {
                alert(`Error signing in: ${error.message}`)
              }
              throw error
            }

            console.log('Auth redirect initiated successfully')
          } catch (error) {
            console.error('Unexpected error during sign in:', error)
            alert('An unexpected error occurred. Please try again later.')
          } finally {
            set({ isLoading: false })
          }
        },

        signOut: async () => {
          try {
            const supabase = getSupabaseBrowserClient()
            const { error } = await supabase.auth.signOut()

            if (error) {
              throw error
            }

            set({ user: null, session: null })
            
            // La redirección será manejada por el componente que llama a signOut
          } catch (error) {
            console.error('Error signing out:', error)
            throw error
          }
        },
      }),
      {
        name: 'auth-storage',
        // Solo persistir datos básicos, no funciones
        partialize: (state) => ({
          user: state.user,
          session: state.session,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
)

// Hook para inicializar el store y escuchar cambios de autenticación
export const useAuthInit = () => {
  const { setUser, setSession, setLoading, refreshSession } = useAuthStore()

  // Función para inicializar Supabase listeners
  const initAuth = () => {
    const supabase = getSupabaseBrowserClient()
    
    // Refresh session on init
    refreshSession()

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session)
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // La redirección será manejada por el callback route
      // No necesitamos redirigir aquí para evitar conflictos
    })

    return () => {
      subscription.unsubscribe()
    }
  }

  return { initAuth }
} 