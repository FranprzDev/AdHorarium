"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'

export function AuthManager({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { init, user, session } = useAuthStore()

  useEffect(() => {
    const unsubscribe = init()
    return () => {
      unsubscribe()
    }
  }, [init])

  useEffect(() => {
    // This effect handles redirection based on auth state changes.
    // The original AuthProvider pushed to '/dashboard' on session change
    // and to '/' on signOut.

    // If there is a session, but the user object is not yet loaded, we wait.
    if (session && !user) return

    if (user && window.location.pathname === '/') {
       router.push('/dashboard')
    }
    
    if (!user && window.location.pathname.startsWith('/dashboard')) {
       router.push('/')
    }

  }, [user, session, router])

  return <>{children}</>
} 