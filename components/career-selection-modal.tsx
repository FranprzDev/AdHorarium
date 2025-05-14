"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"

type Career = {
  id: number
  name: string
  code: string
}

export function CareerSelectionModal() {
  const [careers, setCareers] = useState<Career[]>([])
  const [selectedCareer, setSelectedCareer] = useState<string>("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { user, refreshSession } = useAuth()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchCareers = async () => {
      try {
        const { data, error } = await supabase.from("careers").select("*")

        if (error) {
          throw error
        }

        setCareers(data || [])
      } catch (error) {
        console.error("Error fetching careers:", error)
      }
    }

    const checkUserProfile = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("user_profiles").select("career_id").eq("id", user.id).single()

        if (error) {
          throw error
        }

        if (!data.career_id) {
          setIsOpen(true)
        }
      } catch (error) {
        console.error("Error checking user profile:", error)
        setIsOpen(true)
      }
    }

    fetchCareers()
    checkUserProfile()
  }, [user, supabase])

  const handleSave = async () => {
    if (!selectedCareer || !user) return

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ career_id: Number.parseInt(selectedCareer) })
        .eq("id", user.id)

      if (error) {
        throw error
      }

      await refreshSession()
      setIsOpen(false)
    } catch (error) {
      console.error("Error updating user profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="glass-card p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="gradient-text text-xl font-bold">Selecciona tu carrera</DialogTitle>
          <DialogDescription className="text-purple-200">
            Por favor, selecciona la carrera que estás cursando para personalizar tu experiencia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Select value={selectedCareer} onValueChange={setSelectedCareer}>
            <SelectTrigger className="select">
              <SelectValue placeholder="Selecciona una carrera" />
            </SelectTrigger>
            <SelectContent className="bg-purple-900 border-purple-500/30">
              {careers.map((career) => (
                <SelectItem key={career.id} value={career.id.toString()} className="text-white hover:bg-purple-800">
                  {career.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <motion.div
            className="flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button onClick={handleSave} disabled={!selectedCareer || isLoading} className="primary-button">
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
