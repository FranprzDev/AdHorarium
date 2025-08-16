"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/useAuthStore"
import { AdminLayout } from "@/components/layout/admin-layout"

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAdmin, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/")
      } else if (!isAdmin) {
        router.push("/")
      }
    }
  }, [user, isAdmin, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen gradient-bg">
        <div className="glass-card p-8 text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-300 mx-auto mb-4"></div>
          <p>Verificando permisos...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return <AdminLayout>{children}</AdminLayout>
}
