"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuthStore } from "@/stores/useAuthStore"
import { CareerSelectionModal } from "@/components/career-selection-modal"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookOpen, Calendar, Search, Menu, X, LogOut, User as UserIcon, GraduationCap } from "lucide-react"

interface MainLayoutProps {
  children: React.ReactNode
}

interface Career {
  id: number
  name: string
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuthStore()

  const [careers, setCareers] = useState<Career[]>([])
  const [careerAssigned, setCareerAssigned] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        const [careersRes, profileRes] = await Promise.all([
          fetch("/api/careers"),
          fetch(`/api/profile?userId=${user.id}`),
        ])

        if (careersRes.ok) {
          const { careers: data } = await careersRes.json()
          setCareers(data || [])
        }

        if (profileRes.ok) {
          const { profile } = await profileRes.json()
          if (!profile?.career_id) {
            setCareerAssigned(false)
            setIsModalOpen(true)
          } else {
            setCareerAssigned(true)
          }
        } else {
          setCareerAssigned(false)
          setIsModalOpen(true)
        }
      } catch (err) {
        console.error("Error loading layout data:", err)
      }
    }

    loadData()
  }, [user])

  const handleCareerChange = async (careerId: number) => {
    if (!user) return
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, career_id: careerId }),
      })
      setCareerAssigned(true)
      setIsModalOpen(false)
    } catch (err) {
      console.error("Error updating career:", err)
    }
  }

  const getUserInitials = () => {
    if (user?.full_name) return user.full_name.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return "U"
  }

  const navItems = [
    { name: "Plan de Correlativas", path: "/dashboard", icon: <BookOpen className="h-5 w-5" /> },
    { name: "Gestor de Materias", path: "/dashboard/materias", icon: <GraduationCap className="h-5 w-5" /> },
    { name: "Gestor de Horarios", path: "/dashboard/horarios", icon: <Calendar className="h-5 w-5" /> },
    { name: "Buscador de Mesa", path: "/dashboard/mesas", icon: <Search className="h-5 w-5" /> },
  ]

  return (
    <div className="min-h-screen gradient-bg">
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-white hover:bg-purple-800/30"
        >
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 glass-card border-r border-purple-500/30 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-center mb-8 mt-4">
            <Link href="/dashboard" className="text-2xl font-bold gradient-text">
              UTN FRT
            </Link>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path
              const isDisabled = item.name === "Gestor de Horarios"
              return (
                <Link
                  key={item.path}
                  href={isDisabled ? "#" : item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-300 ${
                    isActive ? "bg-purple-700 text-white" : "text-white hover:bg-purple-800/30"
                  } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-lg"
                      layoutId="sidebar-highlight"
                      transition={{ type: "spring", duration: 0.5 }}
                      style={{ zIndex: -1 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="pt-4 border-t border-purple-500/30 mt-auto">
            <div className="flex items-center gap-3 mb-4">
              <Avatar>
                <AvatarImage src={user?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-purple-700">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">
                  {user?.full_name || user?.email}
                </p>
                <p className="text-xs text-purple-200 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1 text-white hover:bg-purple-800/30" asChild>
                <Link href="/dashboard/profile">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Perfil
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-white hover:bg-purple-800/30"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen md:ml-64">
        <div className="container mx-auto p-4 md:p-6 pt-16 md:pt-6">{children}</div>
      </main>

      <CareerSelectionModal
        isOpen={isModalOpen}
        careers={careers}
        currentCareerId={null}
        onSelectCareer={handleCareerChange}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
