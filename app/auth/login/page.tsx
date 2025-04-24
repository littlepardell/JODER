"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthForm } from "@/components/auth-form"

export default function LoginPage() {
  const router = useRouter()

  // Redirigir a la página principal si ya está en /auth/login
  useEffect(() => {
    const path = window.location.pathname
    if (path === "/auth/login") {
      router.replace("/")
    }
  }, [router])

  return <AuthForm />
}
