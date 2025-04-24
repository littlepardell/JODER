"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createSupabaseClient, getRedirectUrl } from "@/lib/supabase-config"
import { toast } from "./ui/use-toast"

// Definir el tipo de usuario
interface User {
  id: string
  email?: string
  username?: string
  avatar_url?: string
}

// Definir el tipo de contexto de autenticación
interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string, privacySettings: any) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithGithub: () => Promise<void>
  isUsernameAvailable: (username: string) => Promise<boolean>
  setLoading: (loading: boolean) => void
  resetPassword: (email: string) => Promise<void>
  userProfile: any
  supabase: any
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Proveedor de autenticación
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)

  // Inicializar Supabase
  useEffect(() => {
    const client = createSupabaseClient()
    setSupabase(client)
  }, [])

  // Inicializar y escuchar cambios de autenticación
  useEffect(() => {
    if (!supabase) return

    // Verificar si hay una sesión activa
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        getUserProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)
      if (session) {
        await getUserProfile(session.user.id)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    // Función para obtener el perfil del usuario
    async function getUserProfile(userId: string) {
      try {
        setLoading(true)

        // Obtener el perfil del usuario
        const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching user profile:", error)
          throw error
        }

        if (data) {
          // Si existe el perfil, actualizamos el estado
          setUser({
            id: userId,
            email: data.email,
            username: data.username,
            avatar_url: data.avatar_url,
          })
          setUserProfile(data)
        } else {
          // Si no existe el perfil, obtenemos los datos del usuario de auth
          const { data: userData } = await supabase.auth.getUser()

          if (userData && userData.user) {
            // Crear un perfil básico
            const username = `user_${userId.substring(0, 8)}`
            const displayName = userData.user.user_metadata?.full_name || userData.user.email?.split("@")[0] || username

            // Insertar el nuevo perfil
            const { error: insertError } = await supabase.from("profiles").insert({
              id: userId,
              username,
              display_name: displayName,
              avatar_url: userData.user.user_metadata?.avatar_url,
              public_profile: false,
              public_habits: false,
              public_cigarette_streak: true,
              public_joint_streak: true,
              email: userData.user.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

            if (insertError) {
              console.error("Error creating profile:", insertError)
            }

            // Establecer usuario básico
            setUser({
              id: userId,
              email: userData.user.email,
              username,
              avatar_url: userData.user.user_metadata?.avatar_url,
            })

            // Obtener el perfil recién creado
            const { data: newProfile } = await supabase.from("profiles").select("*").eq("id", userId).single()
            setUserProfile(newProfile)
          } else {
            // Si no hay datos de usuario, establecer solo el ID
            setUser({
              id: userId,
            })
          }
        }
      } catch (error) {
        console.error("Error in getUserProfile:", error)
        // Establecer usuario básico en caso de error
        setUser({
          id: userId,
        })
      } finally {
        setLoading(false)
      }
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Función para iniciar sesión
  const signIn = async (email: string, password: string) => {
    if (!supabase) return

    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }
    } catch (error: any) {
      console.error("Error signing in:", error)
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Credenciales incorrectas",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Función para registrarse
  const signUp = async (email: string, password: string, username: string, privacySettings: any) => {
    if (!supabase) return

    try {
      setLoading(true)

      // Registrar al usuario
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })

      if (authError) {
        throw authError
      }

      if (authData.user) {
        // Crear perfil de usuario
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          email,
          username,
          display_name: username,
          public_profile: privacySettings.publicProfile,
          public_habits: privacySettings.publicHabits,
          public_cigarette_streak: privacySettings.publicCigaretteStreak,
          public_joint_streak: privacySettings.publicJointStreak,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (profileError) {
          console.error("Error creating profile:", profileError)
          // No lanzamos error aquí para no interrumpir el flujo
        }

        // Crear registro inicial de datos
        const { error: dataError } = await supabase.from("user_data").insert({
          user_id: authData.user.id,
          sync_data: {
            cigaretteData: {
              streak: 0,
            },
            jointData: {
              streak: 0,
            },
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (dataError) {
          console.error("Error creating user data:", dataError)
          // No lanzamos error aquí para no interrumpir el flujo
        }

        toast({
          title: "Cuenta creada con éxito",
          description: "¡Bienvenido a Habit Tracker!",
        })
      }
    } catch (error: any) {
      console.error("Error signing up:", error)
      toast({
        title: "Error al crear la cuenta",
        description: error.message || "No se pudo crear la cuenta",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Función para cerrar sesión
  const signOut = async () => {
    if (!supabase) return

    try {
      setLoading(true)
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setLoading(false)
    }
  }

  // Función para iniciar sesión con Google
  const signInWithGoogle = async () => {
    if (!supabase) return

    try {
      setLoading(true)
      const redirectUrl = getRedirectUrl()

      if (!redirectUrl) {
        throw new Error("No se pudo determinar la URL de redirección")
      }

      console.log("Iniciando sesión con Google, URL de redirección:", redirectUrl)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) {
        throw error
      }

      console.log("Redirección iniciada:", data)
    } catch (error: any) {
      console.error("Error signing in with Google:", error)
      toast({
        title: "Error al iniciar sesión con Google",
        description: error.message || "No se pudo iniciar sesión con Google",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Función para iniciar sesión con GitHub
  const signInWithGithub = async () => {
    if (!supabase) return

    try {
      setLoading(true)
      const redirectUrl = getRedirectUrl()

      if (!redirectUrl) {
        throw new Error("No se pudo determinar la URL de redirección")
      }

      console.log("Iniciando sesión con GitHub, URL de redirección:", redirectUrl)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: redirectUrl,
          scopes: "read:user user:email",
        },
      })

      if (error) {
        throw error
      }

      console.log("Redirección iniciada:", data)
    } catch (error: any) {
      console.error("Error signing in with GitHub:", error)
      toast({
        title: "Error al iniciar sesión con GitHub",
        description: error.message || "No se pudo iniciar sesión con GitHub",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Función para verificar si un nombre de usuario está disponible
  const isUsernameAvailable = async (username: string) => {
    if (!supabase) return true

    try {
      const { data, error } = await supabase.from("profiles").select("username").eq("username", username).single()

      if (error && error.code === "PGRST116") {
        // PGRST116 significa que no se encontró ningún registro
        return true
      }

      return !data
    } catch (error) {
      console.error("Error checking username:", error)
      // En caso de error, devolvemos true para no bloquear el registro
      return true
    }
  }

  // Función para restablecer la contraseña
  const resetPassword = async (email: string) => {
    if (!supabase) return

    try {
      setLoading(true)
      const redirectUrl = getRedirectUrl()

      if (!redirectUrl) {
        throw new Error("No se pudo determinar la URL de redirección")
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${redirectUrl}/auth/reset-password`,
      })

      if (error) {
        throw error
      }
    } catch (error: any) {
      console.error("Error resetting password:", error)
      toast({
        title: "Error al restablecer contraseña",
        description: error.message || "No se pudo enviar el correo de restablecimiento",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        signInWithGithub,
        isUsernameAvailable,
        setLoading,
        resetPassword,
        userProfile,
        supabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
