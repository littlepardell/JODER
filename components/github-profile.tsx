"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import { Skeleton } from "./ui/skeleton"
import { ExternalLink, Github, Star } from "lucide-react"

interface GitHubProfileProps {
  username: string
}

export function GitHubProfile({ username }: GitHubProfileProps) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGitHubProfile() {
      if (!username) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/github/user?username=${encodeURIComponent(username)}`)

        if (!response.ok) {
          throw new Error("No se pudo obtener el perfil de GitHub")
        }

        const data = await response.json()
        setProfile(data)
      } catch (err: any) {
        console.error("Error al obtener perfil de GitHub:", err)
        setError(err.message || "Error al cargar el perfil")
      } finally {
        setLoading(false)
      }
    }

    fetchGitHubProfile()
  }, [username])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Github className="mr-2 h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-60" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <Github className="mr-2 h-5 w-5" />
            Error al cargar perfil
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!profile) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Github className="mr-2 h-5 w-5" />
          Perfil de GitHub
        </CardTitle>
        <CardDescription>Información de tu cuenta de GitHub conectada</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-16 w-16 border">
            <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.name || profile.login} />
            <AvatarFallback>{profile.login?.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <h3 className="text-lg font-medium">{profile.name || profile.login}</h3>
            <p className="text-sm text-muted-foreground">@{profile.login}</p>

            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-500" />
                <span className="text-sm">{profile.public_repos} repos</span>
              </div>
              <div className="text-sm">{profile.followers} seguidores</div>
            </div>
          </div>

          <div className="ml-auto mt-2 sm:mt-0">
            <Button variant="outline" size="sm" asChild>
              <a href={profile.html_url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                Ver perfil
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>

        {profile.bio && (
          <div className="mt-4 text-sm">
            <p>{profile.bio}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
