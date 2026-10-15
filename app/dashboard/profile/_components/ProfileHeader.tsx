import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BadgeVariant } from "@/types/enums"
import { Separator } from "@/components/ui/separator"
import { User, GraduationCap, Settings } from "lucide-react"
import type { StudentProfile } from "@/db/queries/student"

interface ProfileHeaderProps {
  profile: StudentProfile | null
  onCareerChangeClick: () => void
}

export function ProfileHeader({ profile, onCareerChangeClick }: ProfileHeaderProps) {
  const selectedCareerName = profile?.careerName ?? "No asignada"

  const getUserInitials = () => {
    if (!profile?.email) return "U"
    return profile.email.charAt(0).toUpperCase()
  }

  return (
    <Card className="h-full">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Avatar className="h-28 w-28 border-4 border-secondary">
              <AvatarImage src={profile?.image ?? undefined} />
              <AvatarFallback className="bg-primary font-serif text-3xl font-semibold text-primary-foreground">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <CardTitle className="mb-1 font-serif text-2xl">
          {profile?.name ?? "Usuario"}
        </CardTitle>
        <p className="mb-3 break-all text-sm text-muted-foreground">{profile?.email}</p>
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <User className="h-4 w-4 mr-2" />
          <span>Cuenta Google</span>
        </div>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-muted-foreground">
              <GraduationCap className="h-5 w-5 mr-3" />
              <span>Carrera</span>
            </div>
            <Badge variant={BadgeVariant.Secondary} className="max-w-[60%] text-right">
              {selectedCareerName}
            </Badge>
          </div>
          
          <Button 
            onClick={onCareerChangeClick} 
            disabled={true} 
            variant="outline"
            className="w-full"
          >
            <Settings className="h-4 w-4 mr-2" />
            Cambiar Carrera
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 