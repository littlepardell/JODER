import { createSupabaseClient } from "./supabase-config"

// Función para iniciar sesión con GitHub
export async function signInWithGitHub() {
  const supabase = createSupabaseClient()

  // Obtener la URL de redirección
  const redirectUrl = getRedirectUrl()

  if (!redirectUrl) {
    throw new Error("No se pudo determinar la URL de redirección")
  }

  // Iniciar el flujo de OAuth con GitHub
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: redirectUrl,
    },
  })

  if (error) {
    throw error
  }
}

// Función para obtener la URL de redirección
function getRedirectUrl() {
  // Primero intentamos usar la variable de entorno NEXT_PUBLIC_SITE_URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
  }

  // Si no está disponible, intentamos usar la URL del cliente actual
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol
    const host = window.location.host
    return `${protocol}//${host}/auth/callback`
  }

  // Si nada funciona, devolvemos null
  return null
}
