"use client"

import type React from "react"

import { useAuthStore } from "@/stores/useAuthStore"
import { MainLayout } from "@/components/layout/main-layout"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <MainLayout>{children}</MainLayout>
}
