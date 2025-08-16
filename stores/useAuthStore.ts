import { create, type StateCreator } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Session } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/supabase"

type AuthState = {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAdmin: boolean
  signIn: (provider: "google") => Promise<void>
  signInAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  checkAdminStatus: () => Promise<void>
}

const authStoreCreator: StateCreator<AuthState> = (set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAdmin: false,

  signIn: async (provider: "google") => {
    const supabase = getSupabaseBrowserClient()
    set({ isLoading: true })
    const REDIRECT_URL = "https://v0-web-app-with-gsap-ztvhv0.vercel.app/dashboard"

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: REDIRECT_URL,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })
      if (error) {
        console.error("Error signing in:", error.message)
        alert(`Error signing in: ${error.message}`)
      }
    } catch (error) {
      console.error("Unexpected error during sign in:", error)
      alert("An unexpected error occurred. Please try again later.")
    } finally {
      set({ isLoading: false })
    }
  },

  signInAdmin: async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient()
    set({ isLoading: true })

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        set({ isLoading: false })
        return { success: false, error: error.message }
      }

      if (data.user) {
        set({
          user: data.user,
          session: data.session,
          isLoading: false,
        })

        // Check admin status
        await get().checkAdminStatus()

        return { success: true }
      }

      set({ isLoading: false })
      return { success: false, error: "No user data received" }
    } catch (error) {
      set({ isLoading: false })
      console.error("Unexpected error during admin sign in:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  },

  checkAdminStatus: async () => {
    const { user } = get()
    if (!user) {
      set({ isAdmin: false })
      return
    }

    const supabase = getSupabaseBrowserClient()
    try {
      const { data, error } = await supabase.from("admin_users").select("id").eq("user_id", user.id).single()

      if (error && error.code !== "PGRST116") {
        console.error("Error checking admin status:", error)
        set({ isAdmin: false })
        return
      }

      set({ isAdmin: !!data })
    } catch (error) {
      console.error("Error checking admin status:", error)
      set({ isAdmin: false })
    }
  },

  signOut: async () => {
    const supabase = getSupabaseBrowserClient()
    set({ isLoading: true })
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      set({ user: null, session: null, isAdmin: false })
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      set({ isLoading: false })
    }
  },
})

export const useAuthStore = create<AuthState>()(
  persist(authStoreCreator, {
    name: "auth-storage",
    partialize: (state) => ({
      user: state.user,
      session: state.session,
      isAdmin: state.isAdmin,
    }),
  }),
)

if (typeof window !== "undefined") {
  const supabase = getSupabaseBrowserClient()

  supabase.auth.getSession().then(({ data: { session } }) => {
    const currentState = useAuthStore.getState()

    if (session && !currentState.user) {
      useAuthStore.setState({
        session,
        user: session.user,
        isLoading: false,
      })
      // Check admin status after setting user
      useAuthStore.getState().checkAdminStatus()
    } else if (!session && currentState.user) {
      useAuthStore.setState({
        user: null,
        session: null,
        isAdmin: false,
        isLoading: false,
      })
    } else {
      useAuthStore.setState({ isLoading: false })
      if (session?.user) {
        useAuthStore.getState().checkAdminStatus()
      }
    }
  })

  supabase.auth.onAuthStateChange(async (_event, session) => {
    useAuthStore.setState({
      session,
      user: session?.user ?? null,
      isLoading: false,
    })

    if (session?.user) {
      useAuthStore.getState().checkAdminStatus()
    } else {
      useAuthStore.setState({ isAdmin: false })
    }
  })
}
