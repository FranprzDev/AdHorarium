"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { BookOpen, Calendar, Search, Menu, X, LogOut, User as UserIcon, GraduationCap, ShieldCheck } from "lucide-react"
import { getCareersAction } from "@/app/actions/catalog"
import { getMyCareerIdAction, selectMyCareerAction } from "@/app/actions/student"
import { useCareerStore } from "@/stores/useCareerStore"
import type { Career } from "@/types/types"
import { CareerSelectionModal } from "@/components/career-selection-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/brand/theme-toggle"
import { isAdmin } from "@/lib/auth/roles"
import { cn } from "@/lib/utils"
import { LogoTone } from "@/types/enums"

interface MainLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  path: string
  icon: React.ReactNode
  isDisabled?: boolean
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user
  const selectCareerById = useCareerStore((state) => state.selectCareerById)

  const [careerId, setCareerId] = useState<number | null>(null)
  const [careers, setCareers] = useState<Career[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    const load = async () => {
      const [careersResult, careerResult] = await Promise.all([getCareersAction(), getMyCareerIdAction()])
      if (careersResult.ok) setCareers(careersResult.data)
      else console.error("Error fetching careers:", careersResult.error)
      if (!careerResult.ok) {
        console.error("Error al obtener la carrera del usuario:", careerResult.error)
        return
      }
      setCareerId(careerResult.data)
      if (careerResult.data === null) setIsModalOpen(true)
    }
    void load()
  }, [])

  const handleCareerChange = async (selectedCareerId: number) => {
    const result = await selectMyCareerAction(selectedCareerId)
    if (!result.ok) {
      console.error("Error updating career:", result.error)
      return
    }
    setCareerId(result.data)
    selectCareerById(result.data)
    setIsModalOpen(false)
  }

  const getUserInitials = () => {
    if (!user?.email) return "U"
    return user.email.charAt(0).toUpperCase()
  }

  const navItems: NavItem[] = [
    { name: "Plan de Correlativas", path: "/dashboard", icon: <BookOpen className="h-4 w-4" /> },
    { name: "Gestor de Materias", path: "/dashboard/materias", icon: <GraduationCap className="h-4 w-4" /> },
    { name: "Gestor de Horarios", path: "/dashboard/horarios", icon: <Calendar className="h-4 w-4" /> },
    { name: "Buscador de Mesa", path: "/dashboard/mesas", icon: <Search className="h-4 w-4" /> },
    ...(isAdmin(user?.role) ? [{ name: "Administración", path: "/admin", icon: <ShieldCheck className="h-4 w-4" /> }] : []),
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-sidebar px-4 md:hidden">
        <Link href="/dashboard" aria-label="AdHorarium, plan de correlativas">
          <Logo tone={LogoTone.Inverted} markClassName="h-8 w-8" />
        </Link>
        <button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isSidebarOpen}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center px-5">
            <Link href="/dashboard" aria-label="AdHorarium, plan de correlativas">
              <Logo tone={LogoTone.Inverted} showTagline />
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Secciones">
            <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">Herramientas</p>
            {navItems.map((item) => {
              const isActive = pathname === item.path
              return (
                <Link
                  key={item.path}
                  href={item.isDisabled ? "#" : item.path}
                  aria-current={isActive ? "page" : undefined}
                  aria-disabled={item.isDisabled ? true : undefined}
                  title={item.isDisabled ? "En desarrollo" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-sidebar-muted hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                    item.isDisabled && "pointer-events-none opacity-50",
                  )}
                >
                  {isActive && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand" />}
                  {item.icon}
                  <span className="flex-1">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto border-t border-white/10 p-4">
            <div className="mb-3 flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-white/15">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.name ?? user?.email}</p>
                <p className="truncate text-xs text-sidebar-muted">{user?.email}</p>
              </div>
              <ThemeToggle className="border-white/15 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/dashboard/profile"
                aria-current={pathname === "/dashboard/profile" ? "page" : undefined}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  pathname === "/dashboard/profile" ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-muted",
                )}
              >
                <UserIcon className="h-4 w-4" />
                Perfil
              </Link>
              <button
                type="button"
                onClick={() => void signOut({ redirectTo: "/" })}
                className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen md:ml-64">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>

      <CareerSelectionModal
        isOpen={isModalOpen}
        careers={careers}
        currentCareerId={careerId}
        onSelectCareer={handleCareerChange}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
