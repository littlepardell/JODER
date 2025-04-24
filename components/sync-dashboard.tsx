"use client"

import { useState } from "react"
import { useAuth } from "./auth-provider"
import { useSync, type SyncedData } from "./sync-provider"
import { AuthForm } from "./auth-form"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Textarea } from "./ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { Laptop, Smartphone, Trash2, RefreshCw, Edit, Plus, Save, X, AlertCircle, LogOut, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

export function SyncDashboard() {
  const { user, signOut, loading } = useAuth()
  const {
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
  } = useSync()

  const [newContent, setNewContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log("No user found, showing auth form")
    return <AuthForm />
  }

  console.log("User authenticated, showing dashboard for:", user.email)

  const handleAddData = async () => {
    if (!newContent.trim()) return
    await addData(newContent)
    setNewContent("")
  }

  const handleStartEdit = (item: SyncedData) => {
    setEditingId(item.id)
    setEditContent(item.content)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return
    await updateData(editingId, editContent)
    setEditingId(null)
    setEditContent("")
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent("")
  }

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case "connected":
        return "bg-green-500"
      case "disconnected":
        return "bg-red-500"
      case "syncing":
        return "bg-blue-500 animate-pulse"
      case "error":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getDeviceIcon = (deviceIdStr: string) => {
    if (
      deviceIdStr.toLowerCase().includes("iphone") ||
      deviceIdStr.toLowerCase().includes("android") ||
      deviceIdStr.toLowerCase().includes("mobile")
    ) {
      return <Smartphone className="h-4 w-4 mr-2" />
    }
    return <Laptop className="h-4 w-4 mr-2" />
  }

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user.email) return "U"
    return user.email.charAt(0).toUpperCase()
  }

  // Get user avatar from Google if available
  const getUserAvatar = () => {
    if (user.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url
    }
    return null
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">DeviceSync</h1>
          <p className="text-muted-foreground">Seamless synchronization between your devices</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarImage src={getUserAvatar() || "/placeholder.svg"} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{user.email}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-red-500 flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Tabs defaultValue="data">
            <TabsList className="mb-4">
              <TabsTrigger value="data">Your Data</TabsTrigger>
              <TabsTrigger value="devices">Connected Devices</TabsTrigger>
            </TabsList>

            <TabsContent value="data">
              <Card>
                <CardHeader>
                  <CardTitle>Synchronized Data</CardTitle>
                  <CardDescription>This data is synchronized across all your devices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add new content..."
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleAddData}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>

                    {data.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No data yet. Add some content to get started!</p>
                      </div>
                    ) : (
                      <div className="space-y-4 mt-4">
                        {data.map((item) => (
                          <Card key={item.id}>
                            <CardContent className="p-4">
                              {editingId === item.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full"
                                  />
                                  <div className="flex justify-end space-x-2">
                                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                      <X className="h-4 w-4 mr-2" />
                                      Cancel
                                    </Button>
                                    <Button size="sm" onClick={handleSaveEdit}>
                                      <Save className="h-4 w-4 mr-2" />
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <p className="whitespace-pre-wrap">{item.content}</p>
                                  <div className="flex justify-between items-center mt-4">
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      {getDeviceIcon(item.deviceId)}
                                      <span>
                                        {item.deviceId === deviceId ? "This device" : item.deviceId}
                                        {" • "}
                                        {formatDistanceToNow(new Date(item.lastModified), { addSuffix: true })}
                                      </span>
                                    </div>
                                    <div className="flex space-x-2">
                                      <Button size="sm" variant="outline" onClick={() => handleStartEdit(item)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={() => deleteData(item.id)}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="devices">
              <Card>
                <CardHeader>
                  <CardTitle>Connected Devices</CardTitle>
                  <CardDescription>Devices currently connected to your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Card className="bg-primary/5">
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          {getDeviceIcon(deviceId)}
                          <div>
                            <p className="font-medium">{deviceId} (This Device)</p>
                            <p className="text-sm text-muted-foreground">Current device</p>
                          </div>
                          <Badge className="ml-auto">Active</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {connectedDevices.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>No other devices connected</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {connectedDevices.map((device) => (
                          <Card key={device}>
                            <CardContent className="p-4">
                              <div className="flex items-center">
                                {getDeviceIcon(device)}
                                <div>
                                  <p className="font-medium">{device}</p>
                                  <p className="text-sm text-muted-foreground">Connected</p>
                                </div>
                                <Badge className="ml-auto" variant="outline">
                                  Active
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Sync Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${getSyncStatusColor()}`}></div>
                <span className="capitalize">{syncStatus}</span>
              </div>

              {lastSynced && (
                <div className="text-sm text-muted-foreground">
                  Last synced: {formatDistanceToNow(lastSynced, { addSuffix: true })}
                </div>
              )}

              {pendingChanges > 0 && (
                <div className="flex items-center text-amber-500">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span>
                    {pendingChanges} pending change{pendingChanges !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              <Button className="w-full" onClick={forceSynchronize} disabled={syncStatus === "syncing"}>
                <RefreshCw className={`h-4 w-4 mr-2 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
                Synchronize Now
              </Button>

              <div className="text-xs text-muted-foreground mt-4">
                <p>Device ID: {deviceId}</p>
                <p>Connected devices: {connectedDevices.length + 1}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>DeviceSync uses Supabase for data synchronization between your devices.</p>
              <p>Changes are automatically synchronized when you're online.</p>
              <p>When offline, changes are stored locally and synchronized when you reconnect.</p>
              <p>Conflict resolution ensures your data stays consistent across devices.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
