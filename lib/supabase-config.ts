import { createClient } from "@supabase/supabase-js"

// Obtener las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Función para crear el cliente de Supabase
export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  })
}

// Función para obtener la URL de redirección para OAuth
export function getRedirectUrl() {
  // Primero usamos la variable de entorno definida en Vercel
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
  }
  // Asegurarnos de que este código se ejecute solo en el cliente
  if (typeof window !== "undefined") {
    const { protocol, host } = window.location
    return `${protocol}//${host}/auth/callback`
  }
  // Para SSR, devolver una cadena vacía o un valor por defecto adecuado
  return ""
}

// Función para depurar problemas de autenticación
export function debugAuthConfig() {
  console.log("Supabase URL:", supabaseUrl)
  console.log("Redirect URL:", getRedirectUrl())

  // Verificar si estamos en desarrollo o producción
  const isDevelopment = process.env.NODE_ENV === "development"
  console.log("Environment:", isDevelopment ? "Development" : "Production")

  return {
    supabaseUrl,
    redirectUrl: getRedirectUrl(),
    environment: isDevelopment ? "Development" : "Production",
  }
}
