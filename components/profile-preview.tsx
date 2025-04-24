"use client"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Trophy, Calendar, User, Clock } from "lucide-react"

interface ProfilePreviewProps {
  profile: {
    username: string
    display_name?: string
    avatar_url?: string
    bio?: string
    public_profile: boolean
    public_habits: boolean
    public_cigarette_streak: boolean
    public_joint_streak: boolean
  }
  stats?: {
    cigaretteStreak: number
    jointStreak: number
    daysTracked: number
    habitsCompleted: number
  }
}

export function ProfilePreview({ profile, stats }: ProfilePreviewProps) {
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (profile.display_name) {
      return profile.display_name.charAt(0).toUpperCase()
    }
    if (profile.username) {
      return profile.username.charAt(0).toUpperCase()
    }
    return "U"
  }

  const defaultStats = {
    cigaretteStreak: 7,
    jointStreak: 14,
    daysTracked: 30,
    habitsCompleted: 120,
  }

  const userStats = stats || defaultStats

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/20 to-primary/5 pb-8">
        <CardTitle className="text-sm text-muted-foreground">Vista previa del perfil</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 relative">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
          </Avatar>
        </div>

        <div className="mt-10 text-center">
          <h3 className="text-2xl font-bold">{profile.display_name || profile.username}</h3>
          <p className="text-muted-foreground">@{profile.username}</p>

          {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}

          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Badge variant="outline" className="bg-primary/10 text-primary">
              <Calendar className="h-3 w-3 mr-1" />
              {userStats.daysTracked} días
            </Badge>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500">
              <Trophy className="h-3 w-3 mr-1" />
              {userStats.habitsCompleted} hábitos
            </Badge>
            {profile.public_cigarette_streak && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                <Clock className="h-3 w-3 mr-1" />
                {userStats.cigaretteStreak}d sin cigarrillos
              </Badge>
            )}
            {profile.public_joint_streak && (
              <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
                <Clock className="h-3 w-3 mr-1" />
                {userStats.jointStreak}d sin porros
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Visibilidad del perfil
            </span>
            <Badge variant={profile.public_profile ? "default" : "outline"}>
              {profile.public_profile ? "Público" : "Privado"}
            </Badge>
          </div>

          {profile.public_profile && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Visibilidad de hábitos
                </span>
                <Badge variant={profile.public_habits ? "default" : "outline"}>
                  {profile.public_habits ? "Público" : "Privado"}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <Trophy className="h-4 w-4 mr-2" />
                  Racha sin cigarrillos
                </span>
                <Badge variant={profile.public_cigarette_streak ? "default" : "outline"}>
                  {profile.public_cigarette_streak ? "Público" : "Privado"}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <Trophy className="h-4 w-4 mr-2" />
                  Racha sin porros
                </span>
                <Badge variant={profile.public_joint_streak ? "default" : "outline"}>
                  {profile.public_joint_streak ? "Público" : "Privado"}
                </Badge>
              </div>
            </>
          )}

          {profile.public_cigarette_streak && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Racha sin cigarrillos</span>
                <span className="font-medium">{userStats.cigaretteStreak} días</span>
              </div>
              <Progress value={(userStats.cigaretteStreak / 30) * 100} className="h-2" />
            </div>
          )}

          {profile.public_joint_streak && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Racha sin porros</span>
                <span className="font-medium">{userStats.jointStreak} días</span>
              </div>
              <Progress value={(userStats.jointStreak / 30) * 100} className="h-2" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
