"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { useAuth } from "./auth-provider"
import { Separator } from "./ui/separator"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"
import { Check, X, AlertCircle, Eye, EyeOff, Mail, Lock, User, Info, ArrowLeft } from "lucide-react"
import { Progress } from "./ui/progress"
import { toast } from "./ui/use-toast"
import { Toaster } from "./ui/toaster"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"

export function AuthForm() {
  // Añadir un componente para mostrar errores de autenticación
  const [authError, setAuthError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [privacySettings, setPrivacySettings] = useState({
    publicProfile: false,
    publicHabits: false,
    publicCigaretteStreak: true,
    publicJointStreak: true,
  })
  // Estado para el restablecimiento de contraseña
  const [resetPasswordMode, setResetPasswordMode] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetSent, setResetSent] = useState(false)

  const {
    signIn,
    signUp,
    signInWithGoogle,
    loading,
    isUsernameAvailable,
    setLoading,
    signInWithGithub,
    resetPassword,
  } = useAuth()

  const [activeTab, setActiveTab] = useState("signin")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Añadir este useEffect para capturar errores de URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const error = urlParams.get("error")
      if (error) {
        setAuthError(decodeURIComponent(error))
        // Limpiar el error de la URL
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [])

  // Check username availability with debounce
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    const checkUsername = async () => {
      setUsernameChecking(true)
      try {
        const available = await isUsernameAvailable(username)
        setUsernameAvailable(available)
      } catch (error) {
        console.error("Error checking username:", error)
        // En caso de error, asumimos que el nombre de usuario está disponible para no bloquear el registro
        setUsernameAvailable(true)
        toast({
          title: "Error al verificar nombre de usuario",
          description: "No se pudo verificar si el nombre de usuario está disponible, pero puedes continuar.",
          variant: "destructive",
        })
      } finally {
        setUsernameChecking(false)
      }
    }

    const timer = setTimeout(checkUsername, 500)
    return () => clearTimeout(timer)
  }, [username, isUsernameAvailable])

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0)
      return
    }

    let strength = 0

    // Length check
    if (password.length >= 8) strength += 25

    // Contains number
    if (/\d/.test(password)) strength += 25

    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 25

    // Contains uppercase or special char
    if (/[A-Z]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 25

    setPasswordStrength(strength)
  }, [password])

  // Modificar las funciones de inicio de sesión para capturar errores
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    try {
      await signIn(email, password)
    } catch (error: any) {
      setAuthError(error.message || "Error al iniciar sesión")
    }
  }

  // Añadir un mejor manejo de errores
  const handleSignIn = async (provider: "github" | "google") => {
    setIsLoading(true)
    setError(null)

    try {
      if (provider === "github") {
        await signInWithGithub()
      } else if (provider === "google") {
        await signInWithGoogle()
      }
    } catch (error: any) {
      console.error(`Error al iniciar sesión con ${provider}:`, error)
      setError(`Error al iniciar sesión con ${provider}: ${error.message || "Intenta de nuevo más tarde"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Mejorar el manejo del botón de registro
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    // Deshabilitar el botón durante la validación
    setLoading(true)

    try {
      if (!username || username.length < 3) {
        toast({
          title: "Nombre de usuario inválido",
          description: "Por favor, introduce un nombre de usuario válido (mínimo 3 caracteres)",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!email || !email.includes("@")) {
        toast({
          title: "Email inválido",
          description: "Por favor, introduce un email válido",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!password || password.length < 6) {
        toast({
          title: "Contraseña inválida",
          description: "La contraseña debe tener al menos 6 caracteres",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Verificar nuevamente si el nombre de usuario está disponible
      // Si hay un error, permitimos continuar para no bloquear el registro
      try {
        const available = await isUsernameAvailable(username)
        if (!available) {
          toast({
            title: "Nombre de usuario no disponible",
            description: "Este nombre de usuario ya está en uso. Por favor, elige otro.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
      } catch (error) {
        console.error("Error checking username availability:", error)
        // Continuamos con el registro a pesar del error
      }

      if (passwordStrength < 50) {
        toast({
          title: "Contraseña débil",
          description: "Por favor, utiliza una contraseña más segura",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      console.log("Submitting sign up form with:", email, username)
      await signUp(email, password, username, privacySettings)
    } catch (error: any) {
      console.error("Error during signup form submission:", error)
      toast({
        title: "Error al crear la cuenta",
        description: error.message || "Ha ocurrido un error al crear la cuenta",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  // Función para manejar el restablecimiento de contraseña
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAuthError(null)

    try {
      if (!resetEmail || !resetEmail.includes("@")) {
        toast({
          title: "Email inválido",
          description: "Por favor, introduce un email válido",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      await resetPassword(resetEmail)
      setResetSent(true)
      toast({
        title: "Correo enviado",
        description: "Se ha enviado un correo con instrucciones para restablecer tu contraseña",
      })
    } catch (error: any) {
      console.error("Error resetting password:", error)
      setAuthError(error.message || "Error al enviar el correo de restablecimiento")
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el correo de restablecimiento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setAuthError(null)
    try {
      await signInWithGoogle()
    } catch (error: any) {
      setAuthError(error.message || "Error al iniciar sesión con Google")
    }
  }

  const handleGithubSignIn = async () => {
    setAuthError(null)
    try {
      await signInWithGithub()
    } catch (error: any) {
      setAuthError(error.message || "Error al iniciar sesión con GitHub")
    }
  }

  // Si estamos en modo de restablecimiento de contraseña
  if (resetPasswordMode) {
    return (
      <div className="container flex items-center justify-center min-h-screen py-10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Restablecer contraseña</CardTitle>
            <CardDescription>
              Introduce tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña
            </CardDescription>
          </CardHeader>

          {authError && (
            <div className="mx-4 mb-4 p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-destructive text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {authError}
              </p>
            </div>
          )}

          {resetSent ? (
            <CardContent className="space-y-4 pt-4">
              <div className="text-center p-4">
                <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Correo enviado</h3>
                <p className="text-muted-foreground mt-2">
                  Hemos enviado instrucciones para restablecer tu contraseña a {resetEmail}
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  setResetPasswordMode(false)
                  setResetSent(false)
                }}
              >
                Volver al inicio de sesión
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-sm font-medium flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Introduce tu email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                      Enviando...
                    </>
                  ) : (
                    "Enviar instrucciones"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-center"
                  onClick={() => setResetPasswordMode(false)}
                  type="button"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al inicio de sesión
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Habit Tracker</CardTitle>
          <CardDescription>Seguimiento de hábitos y conexión con amigos</CardDescription>
        </CardHeader>
        {authError && (
          <div className="mx-4 mb-4 p-3 bg-destructive/10 border border-destructive rounded-md">
            <p className="text-destructive text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {authError}
            </p>
          </div>
        )}
        <Tabs defaultValue="signin" onValueChange={(value) => setActiveTab(value)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="signup">Registrarse</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignInSubmit}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Introduce tu email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Introduce tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10"
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto font-normal text-sm text-right w-full"
                  onClick={() => setResetPasswordMode(true)}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                      Iniciando sesión...
                    </>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>

                <div className="flex items-center w-full">
                  <Separator className="flex-1" />
                  <span className="px-3 text-xs text-muted-foreground">O</span>
                  <Separator className="flex-1" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  onClick={() => handleSignIn("google")}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Iniciar sesión con Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center mt-2"
                  onClick={() => handleSignIn("github")}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                    />
                  </svg>
                  Iniciar sesión con GitHub
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Introduce tu email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="username" className="text-sm font-medium flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Nombre de usuario
                    </Label>
                    {username && username.length >= 3 && (
                      <div className="flex items-center">
                        {usernameChecking ? (
                          <span className="text-xs text-muted-foreground">Comprobando...</span>
                        ) : usernameAvailable ? (
                          <span className="text-xs text-green-500 flex items-center">
                            <Check className="h-3 w-3 mr-1" />
                            Disponible
                          </span>
                        ) : (
                          <span className="text-xs text-red-500 flex items-center">
                            <X className="h-3 w-3 mr-1" />
                            En uso
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="username"
                      placeholder="Elige un nombre de usuario único"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      minLength={3}
                      className="pl-10"
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Este será tu identificador público</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Crea una contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10"
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Seguridad de la contraseña</span>
                        <span className="text-xs">
                          {passwordStrength < 25
                            ? "Débil"
                            : passwordStrength < 50
                              ? "Regular"
                              : passwordStrength < 75
                                ? "Buena"
                                : "Fuerte"}
                        </span>
                      </div>
                      <Progress
                        value={passwordStrength}
                        className="h-1"
                        color={
                          passwordStrength < 25
                            ? "bg-red-500"
                            : passwordStrength < 50
                              ? "bg-amber-500"
                              : passwordStrength < 75
                                ? "bg-blue-500"
                                : "bg-green-500"
                        }
                      />
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="privacy-title" className="text-base font-medium flex items-center">
                      Configuración de privacidad
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 ml-2 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-80 text-xs">
                              Estas configuraciones determinan qué información será visible para otros usuarios. Puedes
                              cambiarlas más tarde en tu perfil.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="public-profile" className="text-sm font-medium flex items-center">
                      Perfil público
                      <span className="ml-1 text-xs text-muted-foreground">(Otros pueden encontrarte)</span>
                    </Label>
                    <Switch
                      id="public-profile"
                      checked={privacySettings.publicProfile}
                      onCheckedChange={(checked) => setPrivacySettings((prev) => ({ ...prev, publicProfile: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="public-habits" className="text-sm font-medium flex items-center">
                      Hábitos públicos
                      <span className="ml-1 text-xs text-muted-foreground">(Comparte tu progreso)</span>
                    </Label>
                    <Switch
                      id="public-habits"
                      checked={privacySettings.publicHabits}
                      onCheckedChange={(checked) => setPrivacySettings((prev) => ({ ...prev, publicHabits: checked }))}
                      disabled={!privacySettings.publicProfile}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="public-cigarette" className="text-sm font-medium flex items-center">
                      Racha de cigarrillos pública
                      <span className="ml-1 text-xs text-muted-foreground">(Comparte tu progreso)</span>
                    </Label>
                    <Switch
                      id="public-cigarette"
                      checked={privacySettings.publicCigaretteStreak}
                      onCheckedChange={(checked) =>
                        setPrivacySettings((prev) => ({ ...prev, publicCigaretteStreak: checked }))
                      }
                      disabled={!privacySettings.publicProfile}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="public-joint" className="text-sm font-medium flex items-center">
                      Racha de porros pública
                      <span className="ml-1 text-xs text-muted-foreground">(Comparte tu progreso)</span>
                    </Label>
                    <Switch
                      id="public-joint"
                      checked={privacySettings.publicJointStreak}
                      onCheckedChange={(checked) =>
                        setPrivacySettings((prev) => ({ ...prev, publicJointStreak: checked }))
                      }
                      disabled={!privacySettings.publicProfile}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                      Creando cuenta...
                    </>
                  ) : (
                    "Crear Cuenta"
                  )}
                </Button>

                {passwordStrength < 50 && password && (
                  <div className="flex items-center text-amber-500 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Por favor, utiliza una contraseña más segura
                  </div>
                )}

                <div className="flex items-center w-full">
                  <Separator className="flex-1" />
                  <span className="px-3 text-xs text-muted-foreground">O</span>
                  <Separator className="flex-1" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  onClick={() => handleSignIn("google")}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Registrarse con Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center mt-2"
                  onClick={() => handleSignIn("github")}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                    />
                  </svg>
                  Registrarse con GitHub
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
      <Toaster />
    </div>
  )
}
