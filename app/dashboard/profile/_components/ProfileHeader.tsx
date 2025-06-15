import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, GraduationCap, Settings } from "lucide-react"
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface Profile {
  id: string
  full_name: string
  avatar_url: string
  career_id: number | null
}

interface Career {
  id: number
  name: string
}

interface ProfileHeaderProps {
  user: SupabaseUser | null
  profile: Profile | null
  careers: Career[]
  onCareerChangeClick: () => void
}

export function ProfileHeader({ user, profile, careers, onCareerChangeClick }: ProfileHeaderProps) {
  const selectedCareerName = careers.find((c) => c.id === profile?.career_id)?.name || "No asignada"

  const getUserInitials = () => {
    if (!user?.email) return "U"
    return user.email.charAt(0).toUpperCase()
  }

  return (
    <Card className="glass-card h-full">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-purple-400/30 transition-all duration-300 hover:border-purple-400/60 hover:shadow-lg hover:shadow-purple-500/25">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-3xl font-bold text-white">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <CardTitle className="text-2xl text-white mb-2">
          {user?.user_metadata?.full_name || profile?.full_name || "Usuario"}
        </CardTitle>
        <p className="text-purple-200 mb-4">{user?.email}</p>
        <div className="flex items-center justify-center text-purple-300 text-sm">
          <User className="h-4 w-4 mr-2" />
          <span>Cuenta Google</span>
        </div>
      </CardHeader>
      
      <Separator className="bg-purple-400/20" />
      
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-purple-200">
              <GraduationCap className="h-5 w-5 mr-3" />
              <span>Carrera</span>
            </div>
            <Badge variant="secondary" className="bg-purple-600/30 text-purple-100 border-purple-400/30">
              {selectedCareerName}
            </Badge>
          </div>
          
          <Button 
            onClick={onCareerChangeClick} 
            disabled={!user} 
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 transition-all duration-300"
          >
            <Settings className="h-4 w-4 mr-2" />
            Cambiar Carrera
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 