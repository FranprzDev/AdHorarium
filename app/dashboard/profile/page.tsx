"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuthStore } from "@/stores/auth-store"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Save } from "lucide-react"

type Career = {
  id: number
  name: string
  code: string
}

export default function ProfilePage() {
  const { user, refreshSession } = useAuthStore()
  const [careers, setCareers] = useState<Career[]>([])
  const [selectedCareer, setSelectedCareer] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const { data: careersData, error: careersError } = await supabase.from("careers").select("*")

        if (careersError) throw careersError
        setCareers(careersData || [])

        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from("user_profiles")
            .select("career_id")
            .eq("id", user.id)
            .single()

          if (profileError && profileError.code !== "PGRST116") throw profileError

          if (profileData?.career_id) {
            setSelectedCareer(profileData.career_id.toString())
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, supabase])

  const handleSaveProfile = async () => {
    if (!user) return

    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          career_id: selectedCareer ? Number.parseInt(selectedCareer) : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      await refreshSession()
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setIsSaving(false)
    }
  }

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
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-purple-700 text-2xl">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-medium text-white mb-1">{user?.user_metadata?.full_name || "Usuario"}</h2>
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
                <Select value={selectedCareer} onValueChange={setSelectedCareer} disabled={isLoading}>
                  <SelectTrigger className="select">
                    <SelectValue placeholder="Selecciona tu carrera" />
                  </SelectTrigger>
                  <SelectContent className="bg-purple-900 border-purple-500/30">
                    {careers.map((career) => (
                      <SelectItem
                        key={career.id}
                        value={career.id.toString()}
                        className="text-white hover:bg-purple-800"
                      >
                        {career.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isSaving || isLoading} className="primary-button">
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                  <Save className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AuroraBackground>
  )
}
