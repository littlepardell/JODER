"use client"

import { useState } from "react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { X } from "lucide-react"

interface WelcomeBannerProps {
  username: string
}

export function WelcomeBanner({ username }: WelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) {
    return null
  }

  return (
    <Card className="bg-primary/10 border-primary/20 mb-6">
      <CardContent className="p-4 relative">
        <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={() => setDismissed(true)}>
          <X className="h-4 w-4" />
        </Button>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">¡Bienvenido/a, {username}!</h3>
          <p className="text-sm">
            Gracias por unirte a Habit Tracker. Aquí podrás hacer seguimiento de tus hábitos y conectar con amigos.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button variant="outline" size="sm">
              Ver tutorial
            </Button>
            <Button variant="outline" size="sm">
              Configurar perfil
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
