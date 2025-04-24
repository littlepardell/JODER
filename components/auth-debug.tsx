"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { createSupabaseClient, getRedirectUrl } from "@/lib/supabase-config"

export function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkAuthConfig = async () => {
    setLoading(true)
    try {
      const supabase = createSupabaseClient()
      const redirectUrl = getRedirectUrl()

      // Verificar la configuración de Supabase
      const { data: settings } = await supabase.auth.getSettings()

      // Verificar la sesión actual
      const { data: sessionData } = await supabase.auth.getSession()

      // Verificar los proveedores disponibles
      const providers = ["github", "google"].map((provider) => ({
        provider,
        url: new URL(
          `https://${new URL(settings.url).host}/auth/v1/authorize?provider=${provider}&redirect_to=${redirectUrl}`,
        ).toString(),
      }))

      const info = {
        supabaseUrl: settings.url,
        redirectUrl,
        session: sessionData.session
          ? {
              user: {
                id: sessionData.session.user.id,
                email: sessionData.session.user.email,
                metadata: sessionData.session.user.user_metadata,
              },
              expires_at: new Date(sessionData.session.expires_at * 1000).toLocaleString(),
            }
          : null,
        providers,
      }

      setDebugInfo(info)
      console.log("Auth Debug Info:", info)
    } catch (error) {
      console.error("Error checking auth config:", error)
      setDebugInfo({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Depuración de Autenticación</CardTitle>
        <CardDescription>Herramienta para diagnosticar problemas con la autenticación</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={checkAuthConfig} disabled={loading} className="mb-4">
          {loading ? "Verificando..." : "Verificar Configuración"}
        </Button>

        {debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md overflow-auto">
            <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium">Pasos para solucionar problemas:</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Verifica que la URL de redirección coincida con la configurada en GitHub/Google</li>
            <li>Asegúrate de que los proveedores estén habilitados en Supabase</li>
            <li>Comprueba que el Client ID y Client Secret estén correctamente configurados</li>
            <li>Verifica que la variable NEXT_PUBLIC_SITE_URL esté configurada correctamente</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
