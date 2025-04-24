"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { useAuth } from "./auth-provider"
import { useSync } from "./sync-provider"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, session, loading } = useAuth()
  const { syncStatus, deviceId, connectedDevices } = useSync()

  if (!isOpen) {
    return (
      <Button className="fixed bottom-4 right-4 z-50" variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        Debug
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex justify-between">
          <span>Debug Panel</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsOpen(false)}>
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <strong>Auth State:</strong> {loading ? "Loading..." : user ? "Authenticated" : "Not authenticated"}
        </div>
        {user && (
          <>
            <div>
              <strong>User Email:</strong> {user.email}
            </div>
            <div>
              <strong>User ID:</strong> {user.id}
            </div>
            <div>
              <strong>Auth Provider:</strong> {user.app_metadata?.provider || "email"}
            </div>
            {user.user_metadata?.avatar_url && (
              <div>
                <strong>Avatar:</strong> ✓
              </div>
            )}
          </>
        )}
        <div>
          <strong>Sync Status:</strong> {syncStatus}
        </div>
        <div>
          <strong>Device ID:</strong> {deviceId}
        </div>
        <div>
          <strong>Connected Devices:</strong> {connectedDevices.length + 1}
        </div>
        <div>
          <strong>Environment:</strong>
          <ul className="pl-4">
            <li>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓" : "✗"}</li>
            <li>SUPABASE_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓" : "✗"}</li>
            <li>WEBSOCKET_URL: {process.env.NEXT_PUBLIC_WEBSOCKET_URL ? "✓" : "✗"}</li>
          </ul>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => {
            console.log({
              user,
              session,
              syncStatus,
              deviceId,
              connectedDevices,
              env: {
                SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
                WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
              },
            })
          }}
        >
          Log Debug Info
        </Button>
      </CardContent>
    </Card>
  )
}
