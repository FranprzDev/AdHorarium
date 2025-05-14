"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { CareerSelectionModal } from "@/components/career-selection-modal"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookOpen, Calendar, Search, Menu, X, LogOut, User } from "lucide-react"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return "U"
    return user.email.charAt(0).toUpperCase()
  }

  const navItems = [
    {
      name: "Plan de Correlativas",
      path: "/dashboard",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      name: "Gestor de Horarios",
      path: "/dashboard/horarios",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      name: "Buscador de Mesa",
      path: "/dashboard/mesas",
      icon: <Search className="h-5 w-5" />,
    },
  ]

  return (
    <div className="min-h-screen gradient-bg">
      {/* Mobile menu button */}
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

      {/* Sidebar */}
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

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-300 ${
                    isActive ? "bg-purple-700 text-white" : "text-white hover:bg-purple-800/30"
                  }`}
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
                  <User className="h-4 w-4 mr-2" />
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

      {/* Main content */}
      <main className={`min-h-screen transition-all duration-300 ${isSidebarOpen ? "md:ml-64" : "md:ml-64"}`}>
        <div className="container mx-auto p-4 md:p-6 pt-16 md:pt-6">{children}</div>
      </main>

      {/* Career selection modal */}
      <CareerSelectionModal />
    </div>
  )
}
