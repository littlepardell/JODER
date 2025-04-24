"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { debugAuthConfig } from "@/lib/supabase-config"
import { createSupabaseClient } from "@/lib/supabase-config"

export function DebugAuth() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDebug = async () => {
    setLoading(true)
    try {
      // Obtener información de configuración
      const configInfo = debugAuthConfig()

      // Verificar la sesión actual
      const supabase = createSupabaseClient()
      const { data: sessionData } = await supabase.auth.getSession()

      // Verificar si la URL de callback es accesible
      let callbackStatus = "Unknown"
      try {
        if (typeof window !== "undefined") {
          const callbackUrl = configInfo.redirectUrl
          if (callbackUrl) {
            const response = await fetch(callbackUrl, { method: "HEAD" })
            callbackStatus = response.ok ? "Accessible" : `Error: ${response.status}`
          } else {
            callbackStatus = "No callback URL configured"
          }
        }
      } catch (error: any) {
        callbackStatus = `Error: ${error.message}`
      }

      // Recopilar toda la información
      setDebugInfo({
        config: configInfo,
        session: {
          exists: !!sessionData.session,
          expiresAt: sessionData.session?.expires_at,
        },
        callback: {
          status: callbackStatus,
        },
        browser:
          typeof window !== "undefined"
            ? {
                userAgent: window.navigator.userAgent,
                cookies: document.cookie ? "Enabled" : "Disabled",
                localStorage: window.localStorage ? "Available" : "Unavailable",
              }
            : "Server-side rendering",
      })
    } catch (error: any) {
      setDebugInfo({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Depuración de Autenticación</CardTitle>
        <CardDescription>Herramienta para diagnosticar problemas de autenticación</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={runDebug} disabled={loading}>
          {loading ? "Analizando..." : "Ejecutar diagnóstico"}
        </Button>

        {debugInfo && (
          <div className="mt-4 p-4 bg-muted rounded-md overflow-auto">
            <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
