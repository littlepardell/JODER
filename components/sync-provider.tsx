"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./auth-provider"
import { createSupabaseClient } from "@/lib/supabase-config"
import { toast } from "./ui/use-toast"

// Definir la estructura de los datos
export interface SyncedData {
  id: string
  content: string
  deviceId: string
  lastModified: number
  version: number
}

interface SyncContextType {
  data: SyncedData[]
  addData: (content: string) => Promise<void>
  updateData: (id: string, content: string) => Promise<void>
  deleteData: (id: string) => Promise<void>
  syncStatus: "connected" | "disconnected" | "syncing" | "error"
  lastSynced: Date | null
  deviceId: string
  connectedDevices: string[]
  pendingChanges: number
  forceSynchronize: () => Promise<void>
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [data, setData] = useState<SyncedData[]>([])
  const [syncStatus, setSyncStatus] = useState<"connected" | "disconnected" | "syncing" | "error">("disconnected")
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [deviceId, setDeviceId] = useState<string>("")
  const [connectedDevices, setConnectedDevices] = useState<string[]>([])
  const [pendingChanges, setPendingChanges] = useState(0)
  const [supabaseClient, setSupabaseClient] = useState<any>(null)

  // Generar un ID de dispositivo único
  useEffect(() => {
    // Usar un ID simple basado en la fecha y un número aleatorio
    const generateDeviceId = () => {
      const storedId = localStorage.getItem("device_id")
      if (storedId) {
        return storedId
      }

      // Detectar si es un dispositivo móvil
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      const deviceType = isMobile ? "mobile" : "desktop"

      // Añadir información del navegador
      const browserInfo =
        navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome")
          ? "Safari"
          : navigator.userAgent.includes("Firefox")
            ? "Firefox"
            : navigator.userAgent.includes("Chrome")
              ? "Chrome"
              : "Browser"

      const newId = `${deviceType}_${browserInfo}_${Date.now().toString(36)}`
      localStorage.setItem("device_id", newId)
      return newId
    }

    setDeviceId(generateDeviceId())
  }, [])

  // Inicializar Supabase
  useEffect(() => {
    const client = createSupabaseClient()
    setSupabaseClient(client)
  }, [])

  // Configurar suscripción en tiempo real cuando el usuario cambia
  useEffect(() => {
    if (!user || !supabaseClient) return

    // Cargar datos iniciales
    loadData()

    // Configurar suscripción en tiempo real
    const channel = supabaseClient
      .channel("synced_data_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "synced_data",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          console.log("Cambio en tiempo real recibido:", payload)

          // Actualizar los datos locales basados en el evento
          if (payload.eventType === "INSERT") {
            // Ignorar si el dispositivo actual es el que hizo el cambio
            if (payload.new.device_id !== deviceId) {
              const newItem = {
                id: payload.new.id,
                content: payload.new.content,
                deviceId: payload.new.device_id,
                lastModified: payload.new.last_modified,
                version: payload.new.version || 1,
              }
              setData((prev) => [newItem, ...prev.filter((item) => item.id !== newItem.id)])
              toast({
                title: "Nuevo dato sincronizado",
                description: "Se ha añadido un nuevo elemento desde otro dispositivo",
              })
            }
          } else if (payload.eventType === "UPDATE") {
            // Ignorar si el dispositivo actual es el que hizo el cambio
            if (payload.new.device_id !== deviceId) {
              const updatedItem = {
                id: payload.new.id,
                content: payload.new.content,
                deviceId: payload.new.device_id,
                lastModified: payload.new.last_modified,
                version: payload.new.version || 1,
              }
              setData((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
              toast({
                title: "Dato actualizado",
                description: "Un elemento ha sido actualizado desde otro dispositivo",
              })
            }
          } else if (payload.eventType === "DELETE") {
            setData((prev) => prev.filter((item) => item.id !== payload.old.id))
            toast({
              title: "Dato eliminado",
              description: "Un elemento ha sido eliminado desde otro dispositivo",
            })
          }

          // Actualizar el estado de sincronización
          setLastSynced(new Date())
        },
      )
      .subscribe()

    // Limpiar la suscripción cuando el componente se desmonte
    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [user, supabaseClient, deviceId])

  // Función para cargar datos
  const loadData = async () => {
    if (!user || !supabaseClient) return

    try {
      setSyncStatus("syncing")

      const { data: syncedData, error } = await supabaseClient
        .from("synced_data")
        .select("*")
        .eq("user_id", user.id)
        .order("last_modified", { ascending: false })

      if (error) throw error

      // Convertir los datos al formato esperado
      const formattedData = syncedData.map((item: any) => ({
        id: item.id,
        content: item.content,
        deviceId: item.device_id,
        lastModified: item.last_modified,
        version: item.version || 1,
      }))

      setData(formattedData)
      setLastSynced(new Date())
      setSyncStatus("connected")
      setPendingChanges(0)

      // Obtener dispositivos conectados
      const uniqueDevices = [...new Set(syncedData.map((item: any) => item.device_id))]
      setConnectedDevices(uniqueDevices.filter((d) => d !== deviceId))
    } catch (error) {
      console.error("Error loading data:", error)
      setSyncStatus("error")
      toast({
        title: "Error de sincronización",
        description: "No se pudieron cargar tus datos. Intenta de nuevo más tarde.",
        variant: "destructive",
      })
    }
  }

  // Función para añadir datos
  const addData = async (content: string) => {
    if (!user || !supabaseClient) return

    try {
      setSyncStatus("syncing")

      // Crear un ID único para el nuevo elemento
      const id = `data_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      const timestamp = Date.now()

      // Añadir a la base de datos
      const { error } = await supabaseClient.from("synced_data").insert({
        id,
        content,
        device_id: deviceId,
        last_modified: timestamp,
        version: 1,
        user_id: user.id,
      })

      if (error) throw error

      // Actualizar el estado local
      const newItem = {
        id,
        content,
        deviceId,
        lastModified: timestamp,
        version: 1,
      }

      setData((prev) => [newItem, ...prev])
      setLastSynced(new Date())
      setSyncStatus("connected")
    } catch (error) {
      console.error("Error adding data:", error)
      setSyncStatus("error")
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar tu contenido. Intenta de nuevo.",
        variant: "destructive",
      })
    }
  }

  // Función para actualizar datos
  const updateData = async (id: string, content: string) => {
    if (!user || !supabaseClient) return

    try {
      setSyncStatus("syncing")

      // Encontrar el elemento existente
      const existingItem = data.find((item) => item.id === id)
      if (!existingItem) throw new Error("Item not found")

      const timestamp = Date.now()
      const newVersion = existingItem.version + 1

      // Actualizar en la base de datos
      const { error } = await supabaseClient
        .from("synced_data")
        .update({
          content,
          device_id: deviceId,
          last_modified: timestamp,
          version: newVersion,
        })
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) throw error

      // Actualizar el estado local
      setData((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, content, deviceId, lastModified: timestamp, version: newVersion } : item,
        ),
      )

      setLastSynced(new Date())
      setSyncStatus("connected")
    } catch (error) {
      console.error("Error updating data:", error)
      setSyncStatus("error")
      toast({
        title: "Error al actualizar",
        description: "No se pudo actualizar tu contenido. Intenta de nuevo.",
        variant: "destructive",
      })
    }
  }

  // Función para eliminar datos
  const deleteData = async (id: string) => {
    if (!user || !supabaseClient) return

    try {
      setSyncStatus("syncing")

      // Eliminar de la base de datos
      const { error } = await supabaseClient.from("synced_data").delete().eq("id", id).eq("user_id", user.id)

      if (error) throw error

      // Actualizar el estado local
      setData((prev) => prev.filter((item) => item.id !== id))

      setLastSynced(new Date())
      setSyncStatus("connected")
    } catch (error) {
      console.error("Error deleting data:", error)
      setSyncStatus("error")
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar tu contenido. Intenta de nuevo.",
        variant: "destructive",
      })
    }
  }

  // Función para forzar la sincronización
  const forceSynchronize = async () => {
    await loadData()
  }

  return (
    <SyncContext.Provider
      value={{
        data,
        addData,
        updateData,
        deleteData,
        syncStatus,
        lastSynced,
        deviceId,
        connectedDevices,
        pendingChanges,
        forceSynchronize,
      }}
    >
      {children}
    </SyncContext.Provider>
  )
}

export function useSync() {
  const context = useContext(SyncContext)
  if (context === undefined) {
    throw new Error("useSync must be used within a SyncProvider")
  }
  return context
}
