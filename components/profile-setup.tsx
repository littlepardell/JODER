"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "./auth-provider"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Switch } from "./ui/switch"
import { Label } from "./ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Camera, Save, User, Eye, Trophy, Calendar } from "lucide-react"
import { toast } from "./ui/use-toast"
import { Separator } from "./ui/separator"
import { supabase } from "@/lib/supabase"

export function ProfileSetup() {
  const { user, userProfile, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    display_name: "",
    bio: "",
    public_profile: false,
    public_habits: false,
    public_cigarette_streak: true,
    public_joint_streak: true,
  })

  // Cargar datos del perfil cuando estén disponibles
  useEffect(() => {
    if (userProfile) {
      setFormData({
        username: userProfile.username || "",
        display_name: userProfile.display_name || "",
        bio: userProfile.bio || "",
        public_profile: userProfile.public_profile || false,
        public_habits: userProfile.public_habits || false,
        public_cigarette_streak:
          userProfile.public_cigarette_streak !== undefined ? userProfile.public_cigarette_streak : true,
        public_joint_streak: userProfile.public_joint_streak !== undefined ? userProfile.public_joint_streak : true,
      })
    }
  }, [userProfile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadingAvatar(true)
    try {
      // Crear un nombre único para el archivo
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Subir el archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file)

      if (uploadError) throw uploadError

      // Obtener la URL pública del archivo
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath)

      if (!urlData.publicUrl) throw new Error("No se pudo obtener la URL del avatar")

      // Actualizar el perfil con la nueva URL
      await updateProfile({ avatar_url: urlData.publicUrl })

      toast({
        title: "Avatar actualizado",
        description: "Tu foto de perfil ha sido actualizada correctamente",
      })
    } catch (error: any) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Error al subir avatar",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await updateProfile(formData)
      toast({
        title: "Perfil actualizado",
        description: "Tu perfil ha sido actualizado correctamente",
      })
    } catch (error: any) {
      toast({
        title: "Error al actualizar el perfil",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (formData.display_name) {
      return formData.display_name.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return "U"
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p>Por favor inicia sesión para configurar tu perfil</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configura tu perfil</CardTitle>
        <CardDescription>Personaliza tu perfil y configura tus preferencias de privacidad</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={userProfile?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2">
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
              <label
                htmlFor="avatar-upload"
                className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center cursor-pointer"
              >
                {uploadingAvatar ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </label>
            </div>
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1">
            <h3 className="text-2xl font-bold">{formData.display_name || formData.username || user.email}</h3>
            <p className="text-muted-foreground">@{formData.username}</p>
            {formData.bio && <p className="text-sm mt-2">{formData.bio}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Nombre de usuario
            </Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Introduce un nombre de usuario único"
            />
            <p className="text-xs text-muted-foreground">Este será tu identificador público</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Nombre para mostrar
            </Label>
            <Input
              id="display_name"
              name="display_name"
              value={formData.display_name}
              onChange={handleInputChange}
              placeholder="Introduce tu nombre para mostrar"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biografía</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Cuéntanos sobre ti"
              className="min-h-[100px]"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Configuración de privacidad</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="public_profile" className="text-base flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Perfil público
                </Label>
                <p className="text-sm text-muted-foreground">Permitir que otros te encuentren y vean tu perfil</p>
              </div>
              <Switch
                id="public_profile"
                checked={formData.public_profile}
                onCheckedChange={(checked) => handleSwitchChange("public_profile", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="public_habits" className="text-base flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Hábitos públicos
                </Label>
                <p className="text-sm text-muted-foreground">Mostrar tu progreso de hábitos a otros</p>
              </div>
              <Switch
                id="public_habits"
                checked={formData.public_habits}
                onCheckedChange={(checked) => handleSwitchChange("public_habits", checked)}
                disabled={!formData.public_profile}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="public_cigarette_streak" className="text-base flex items-center">
                  <Trophy className="h-4 w-4 mr-2" />
                  Racha de cigarrillos pública
                </Label>
                <p className="text-sm text-muted-foreground">Mostrar tu racha sin cigarrillos a otros</p>
              </div>
              <Switch
                id="public_cigarette_streak"
                checked={formData.public_cigarette_streak}
                onCheckedChange={(checked) => handleSwitchChange("public_cigarette_streak", checked)}
                disabled={!formData.public_profile}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="public_joint_streak" className="text-base flex items-center">
                  <Trophy className="h-4 w-4 mr-2" />
                  Racha de porros pública
                </Label>
                <p className="text-sm text-muted-foreground">Mostrar tu racha sin porros a otros</p>
              </div>
              <Switch
                id="public_joint_streak"
                checked={formData.public_joint_streak}
                onCheckedChange={(checked) => handleSwitchChange("public_joint_streak", checked)}
                disabled={!formData.public_profile}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
