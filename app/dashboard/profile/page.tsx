"use client"

import { useAuthStore } from "@/stores/useAuthStore"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { CareerSelectionModal } from "@/components/career-selection-modal"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Save } from "lucide-react"

interface Profile {
  id: string
  fullName: string
  avatarUrl: string
  career_id: number | null
}

interface Career {
  id: number
  name: string
}

export default function ProfilePage() {
  const { user, refreshSession } = useAuthStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [careers, setCareers] = useState<Career[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*, career_id")
          .eq("id", user.id)
          .single()

        if (error) {
          console.error("Error fetching profile:", error)
        } else {
          setProfile(data)
        }
      }
    }

    async function fetchCareers() {
      const { data, error } = await supabase.from("careers").select("id, name")
      if (error) {
        console.error("Error fetching careers:", error)
      } else {
        setCareers(data)
      }
    }

    fetchProfile()
    fetchCareers()
  }, [user, supabase])

  const handleCareerChange = async (careerId: number) => {
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ career_id: careerId })
        .eq("id", user.id)

      if (error) {
        console.error("Error updating career:", error)
      } else {
        await refreshSession()
        // Fetch profile again to get updated data
        const { data } = await supabase
          .from("profiles")
          .select("*, career_id")
          .eq("id", user.id)
          .single()
        setProfile(data)
        setIsModalOpen(false)
      }
    }
  }

  const selectedCareerName =
    careers.find((c) => c.id === profile?.career_id)?.name ||
    "No asignada"

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return "U"
    return user.email.charAt(0).toUpperCase()
  }

  return (
    <AuroraBackground className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-6">Perfil de Usuario</h1>
        <p className="text-purple-200 mb-8">Gestiona tu información personal y preferencias</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="glass-card col-span-1">
            <CardHeader>
              <CardTitle className="text-white">Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={profile?.avatarUrl} />
                <AvatarFallback className="bg-purple-700 text-2xl">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-medium text-white mb-1">{profile?.fullName || "Usuario"}</h2>
              <p className="text-purple-200 mb-4">{user?.email}</p>
              <div className="flex items-center text-purple-300 text-sm">
                <User className="h-4 w-4 mr-2" />
                <span>Cuenta vinculada con Google</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Preferencias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-purple-200 mb-2 block">Carrera</label>
                <div className="select flex items-center justify-between">
                  <span>{selectedCareerName}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setIsModalOpen(true)} disabled={!user} className="primary-button">
                  Cambiar Carrera
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {isModalOpen && (
          <CareerSelectionModal
            isOpen={isModalOpen}
            careers={careers}
            currentCareerId={profile?.career_id ?? null}
            onSelectCareer={handleCareerChange}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </motion.div>
    </AuroraBackground>
  )
}
