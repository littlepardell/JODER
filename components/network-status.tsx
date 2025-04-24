"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    // Verificar el estado inicial de la conexión
    setIsOnline(navigator.onLine)

    // Configurar los event listeners
    const handleOnline = () => {
      setIsOnline(true)
      setShowAlert(true)
      // Ocultar la alerta después de 3 segundos
      setTimeout(() => setShowAlert(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowAlert(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Limpiar los event listeners
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!showAlert) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <Alert variant={isOnline ? "default" : "destructive"}>
        {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <AlertTitle>{isOnline ? "Conexión restaurada" : "Sin conexión"}</AlertTitle>
        <AlertDescription>
          {isOnline
            ? "Tu conexión a Internet ha sido restaurada. Tus datos se sincronizarán automáticamente."
            : "No tienes conexión a Internet. Tus cambios se guardarán localmente y se sincronizarán cuando vuelvas a estar en línea."}
        </AlertDescription>
      </Alert>
    </div>
  )
}
