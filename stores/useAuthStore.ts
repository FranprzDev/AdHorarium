import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  provider: string
}

type AuthState = {
  user: AuthUser | null
  isLoading: boolean
  error: string | null
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, full_name: string) => Promise<void>
  signInWithGoogle: () => void
  signOut: () => Promise<void>
  fetchMe: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),

      fetchMe: async () => {
        set({ isLoading: true })
        try {
          const res = await fetch('/api/auth/me')
          if (res.ok) {
            const { user } = await res.json()
            set({ user, isLoading: false })
          } else {
            set({ user: null, isLoading: false })
          }
        } catch {
          set({ user: null, isLoading: false })
        }
      },

      signInWithPassword: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          const data = await res.json()
          if (!res.ok) {
            set({ error: data.error || 'Error al iniciar sesión', isLoading: false })
            return
          }
          set({ user: data.user, isLoading: false, error: null })
        } catch {
          set({ error: 'Error de conexión. Intentá de nuevo.', isLoading: false })
        }
      },

      signUp: async (email: string, password: string, full_name: string) => {
        set({ isLoading: true, error: null })
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, full_name }),
          })
          const data = await res.json()
          if (!res.ok) {
            set({ error: data.error || 'Error al registrarse', isLoading: false })
            return
          }
          set({ user: data.user, isLoading: false, error: null })
        } catch {
          set({ error: 'Error de conexión. Intentá de nuevo.', isLoading: false })
        }
      },

      signInWithGoogle: () => {
        window.location.href = '/api/auth/google'
      },

      signOut: async () => {
        set({ isLoading: true })
        try {
          await fetch('/api/auth/logout', { method: 'POST' })
          set({ user: null, isLoading: false, error: null })
        } catch {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)

// Verificar sesión activa al cargar la app
if (typeof window !== 'undefined') {
  useAuthStore.getState().fetchMe()
}
