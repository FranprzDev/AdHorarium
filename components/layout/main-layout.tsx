"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuthStore } from "@/stores/useAuthStore"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { CareerSelectionModal } from "@/components/career-selection-modal"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookOpen, Calendar, Search, Menu, X, LogOut, User as UserIcon, GraduationCap } from "lucide-react"

interface MainLayoutProps {
  children: React.ReactNode
}

interface Profile {
  id: string;
  career_id: number | null;
}

interface Career {
  id: number;
  name: string;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuthStore()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [careers, setCareers] = useState<Career[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    async function fetchCareers() {
      const { data, error } = await supabase.from("careers").select("id, name")
      if (error) console.error("Error fetching careers:", error)
      else setCareers(data)
    }

    async function checkUserProfile() {
      if (!user) return

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("id, career_id")
        .eq("id", user.id)
        .maybeSingle()

      if (error) {
        console.error("Error real al obtener el perfil en layout:", error)
        return
      }

      if (!profileData) {
        setProfile({ id: user.id, career_id: null })
        setIsModalOpen(true)
        return
      }

      setProfile(profileData)
      if (!profileData.career_id) {
        setIsModalOpen(true)
      }
    }

    fetchCareers()
    checkUserProfile()
  }, [user, supabase])

  const handleCareerChange = async (careerId: number) => {
    if (!user) return
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, career_id: careerId, updated_at: new Date().toISOString() }, { onConflict: 'id' })

    if (error) {
      console.error("Error updating career:", error)
      return
    }

    const { data } = await supabase
      .from("profiles")
      .select("id, career_id")
      .eq("id", user.id)
      .maybeSingle()

    setProfile(data ?? { id: user.id, career_id: careerId })
    setIsModalOpen(false)
  }

  const getUserInitials = () => {
    if (!user?.email) return "U"
    return user.email.charAt(0).toUpperCase()
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
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white hover:bg-purple-800/30">
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
            <Link href="/dashboard" className="text-2xl font-bold gradient-text">UTN FRT</Link>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path
              return (
                <Link
                  key={item.path}
                  href={item.name === "Gestor de Horarios" ? "#" : item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-300 ${
                    isActive
                      ? "bg-purple-700 text-white"
                      : "text-white hover:bg-purple-800/30"
                  } ${
                    item.name === "Gestor de Horarios" &&
                    "cursor-not-allowed opacity-50"
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.div className="absolute inset-0 rounded-lg" layoutId="sidebar-highlight" transition={{ type: "spring", duration: 0.5 }} style={{ zIndex: -1 }} />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="pt-4 border-t border-purple-500/30 mt-auto">
            <div className="flex items-center gap-3 mb-4">
              <Avatar>
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-purple-700">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">
                  {user?.user_metadata?.full_name || user?.email}
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

              <Button variant="ghost" size="sm" className="flex-1 text-white hover:bg-purple-800/30" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <main className={`min-h-screen transition-all duration-300 ${isSidebarOpen ? "md:ml-64" : "md:ml-64"}`}>
        <div className="container mx-auto p-4 md:p-6 pt-16 md:pt-6">{children}</div>
      </main>

      <CareerSelectionModal
        isOpen={isModalOpen}
        careers={careers}
        currentCareerId={profile?.career_id ?? null}
        onSelectCareer={handleCareerChange}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
