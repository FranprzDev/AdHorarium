"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (provider: "google") => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const REDIRECT_URL = process.env.NEXT_PUBLIC_DEPLOY_URL;
  console.log(REDIRECT_URL)

  const refreshSession = async () => {
    try {
      setIsLoading(true)
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        throw error
      }

      if (session) {
        setSession(session)
        setUser(session.user)
      }
    } catch (error) {
      console.error("Error refreshing session:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)

      if (session) {
        router.push("/dashboard")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const signIn = async (provider: "google") => {
    try {
      setIsLoading(true)
      console.log(REDIRECT_URL + "/dashboard")
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: "https://adhorarium.vercel.app/dashboard",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) {
        if (error.message.includes("provider is not enabled")) {
          console.error("Google authentication is not enabled in Supabase")
          alert("Google authentication is not enabled. Please contact the administrator.")
        } else {
          console.error("Error signing in:", error.message)
          alert(`Error signing in: ${error.message}`)
        }
      }

      return data
    } catch (error) {
      console.error("Unexpected error during sign in:", error)
      alert("An unexpected error occurred. Please try again later.")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      setUser(null)
      setSession(null)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signOut,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
