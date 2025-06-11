"use client"

import { useEffect } from 'react'
import { useAuthInit } from '@/stores/auth-store'

interface AuthInitializerProps {
  children: React.ReactNode
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const { initAuth } = useAuthInit()

  useEffect(() => {
    const cleanup = initAuth()
    return cleanup
  }, [])

  return <>{children}</>
} 