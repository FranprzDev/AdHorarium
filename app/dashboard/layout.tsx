"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { BrandLoader } from "@/components/brand/brand-loader"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { status } = useSession()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  if (status === "loading") {
    return <BrandLoader label="Cargando tu sesión..." />
  }

  if (status !== "authenticated") {
    return null
  }

  return <MainLayout>{children}</MainLayout>
}
