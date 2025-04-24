"use client"

import { useEffect, useState } from "react"
import HabitTracker from "./habit-tracker"
import { createPortal } from "react-dom"
import { useAuth } from "./auth-provider"

export function HabitTrackerLoader() {
  const [mounted, setMounted] = useState(false)
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.log("ServiceWorker registration failed: ", err)
        })
      })
    }

    // Mark as mounted
    setMounted(true)

    // Force dark theme
    document.documentElement.classList.add("dark")
  }, [])

  // Don't render anything until mounted
  if (!mounted) return null

  // Use createPortal to render in the div #app-root
  const appRoot = document.getElementById("app-root")
  if (!appRoot) return null

  // If auth is still loading, show loading state
  if (authLoading) {
    return createPortal(
      <div className="text-center py-10">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Verificando sesión...</p>
      </div>,
      appRoot,
    )
  }

  // If user is not authenticated, show a message
  if (!user) {
    return createPortal(
      <div className="text-center py-10">
        <p>Por favor inicia sesión para acceder al seguimiento de hábitos</p>
      </div>,
      appRoot,
    )
  }

  // User is authenticated, render the habit tracker
  return createPortal(<HabitTracker />, appRoot)
}
