"use client"
import { AuthProvider } from "@/components/auth-provider"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6">
        <AuthProvider>
          {children}
        </AuthProvider>
      </div>
    </div>
  )
}
