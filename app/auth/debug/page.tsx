import { AuthDebug } from "@/components/auth-debug"

export default function AuthDebugPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Depuración de Autenticación</h1>
      <AuthDebug />
    </div>
  )
}
