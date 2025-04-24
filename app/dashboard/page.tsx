"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HabitTracker } from "@/components/habit-tracker"
import { UserProfile } from "@/components/user-profile"
import { SyncDashboard } from "@/components/sync-dashboard"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Home, User, RefreshCw, LogIn } from "lucide-react"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState("habits")
  const router = useRouter()

  // Redirigir a la página de inicio de sesión si no hay usuario
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  // Añadir un useEffect para asegurar que se cargue la pestaña correcta al iniciar sesión
  useEffect(() => {
    // Verificar si hay una pestaña guardada en localStorage
    const savedTab = localStorage.getItem("activeTab")
    if (savedTab && ["habits", "profile", "sync"].includes(savedTab)) {
      setActiveTab(savedTab)
    }
  }, [])

  // Modificar el setActiveTab para que también guarde la pestaña en localStorage
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    localStorage.setItem("activeTab", tab)
  }

  // Reemplazar el bloque de carga con un componente más simple
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Cargando tu dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mejorar el bloque de redirección
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <p className="text-lg font-medium">Debes iniciar sesión para acceder a esta página</p>
            <p className="text-muted-foreground">
              Serás redirigido a la página de inicio de sesión en unos segundos...
            </p>
            <Button onClick={() => router.push("/auth/login")} className="mt-4">
              <LogIn className="mr-2 h-4 w-4" />
              Iniciar sesión ahora
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="habits">
            <Home className="h-4 w-4 mr-2" />
            <span>Hábitos</span>
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            <span>Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="sync">
            <RefreshCw className="h-4 w-4 mr-2" />
            <span>Sincronización</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="habits">
          <HabitTracker />
        </TabsContent>

        <TabsContent value="profile">
          <UserProfile />
        </TabsContent>

        <TabsContent value="sync">
          <SyncDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
