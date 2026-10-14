import type React from "react"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { MainLayout } from "@/components/layout/main-layout"
import { isAdmin } from "@/lib/auth/roles"
import { getStoredUserRole } from "@/lib/auth/session"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect("/")
  if (!isAdmin(await getStoredUserRole(userId))) redirect("/acceso-denegado")
  return <MainLayout>{children}</MainLayout>
}
