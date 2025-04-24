"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./auth-provider"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Search, UserPlus, Users, UserX, Clock, Check, X, UserCheck } from "lucide-react"
import { Skeleton } from "./ui/skeleton"
import { toast } from "./ui/use-toast"
import { Badge } from "./ui/badge"

type UserWithStreaks = {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  bio?: string
  cigarette_streak?: number
  joint_streak?: number
  relationship?: "none" | "following" | "friend" | "pending_sent" | "pending_received"
}

export function FriendsDashboard() {
  const { user, supabase, userProfile } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserWithStreaks[]>([])
  const [allUsers, setAllUsers] = useState<UserWithStreaks[]>([])
  const [friends, setFriends] = useState<UserWithStreaks[]>([])
  const [pendingRequests, setPendingRequests] = useState<UserWithStreaks[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("friends")

  // Función para obtener todos los usuarios públicos
  const fetchAllUsers = async () => {
    if (!user) return

    try {
      setLoading(true)
      console.log("Fetching all public users")

      // Obtener todos los perfiles públicos excepto el del usuario actual
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("public_profile", true)
        .neq("id", user.id)
        .limit(50)

      if (error) {
        console.error("Error fetching public users:", error)
        return
      }

      if (!data || data.length === 0) {
        console.log("No public users found")
        setAllUsers([])
        return
      }

      console.log(`Found ${data.length} public users`)

      // Get friend relationships
      const { data: friendRequestsData, error: friendRequestsError } = await supabase
        .from("friend_requests")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

      if (friendRequestsError) {
        console.error("Error fetching friend relationships:", friendRequestsError)
      }

      // Get streak data for these users
      const userIds = data.map((profile) => profile.id)
      const { data: streaksData, error: streaksError } = await supabase
        .from("consumption_streaks")
        .select("*")
        .in("user_id", userIds)
        .eq("public", true)

      if (streaksError) {
        console.error("Error fetching streak data:", streaksError)
      }

      // Combine all data
      const usersWithData = data.map((profile) => {
        // Determine relationship
        let relationship: "none" | "friend" | "pending_sent" | "pending_received" = "none"

        if (friendRequestsData) {
          const friendRequest = friendRequestsData.find(
            (fr) =>
              (fr.sender_id === user.id && fr.receiver_id === profile.id) ||
              (fr.sender_id === profile.id && fr.receiver_id === user.id),
          )

          if (friendRequest) {
            if (friendRequest.status === "accepted") {
              relationship = "friend"
            } else if (friendRequest.status === "pending") {
              if (friendRequest.sender_id === user.id) {
                relationship = "pending_sent"
              } else {
                relationship = "pending_received"
              }
            }
          }
        }

        // Get streak data if available
        const cigaretteStreak = streaksData?.find(
          (s) => s.user_id === profile.id && s.streak_type === "cigarettes" && profile.public_cigarette_streak,
        )

        const jointStreak = streaksData?.find(
          (s) => s.user_id === profile.id && s.streak_type === "joints" && profile.public_joint_streak,
        )

        return {
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          cigarette_streak: cigaretteStreak?.current_streak || 0,
          joint_streak: jointStreak?.current_streak || 0,
          relationship,
        }
      })

      setAllUsers(usersWithData)
      // Filter search results based on current query
      filterSearchResults(usersWithData)
    } catch (error) {
      console.error("Error in fetchAllUsers:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter search results based on query
  const filterSearchResults = (users: UserWithStreaks[] = allUsers) => {
    if (!searchQuery.trim()) {
      setSearchResults(users)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        (user.display_name && user.display_name.toLowerCase().includes(query)),
    )
    setSearchResults(filtered)
  }

  // Mejorar el manejo de errores y la carga en el componente FriendsDashboard
  const fetchFriends = async () => {
    try {
      // Get accepted friend requests where the user is either sender or receiver
      const { data: friendRequestsData, error: friendRequestsError } = await supabase
        .from("friend_requests")
        .select("sender_id, receiver_id")
        .eq("status", "accepted")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

      if (friendRequestsError) {
        console.error("Error fetching friend requests:", friendRequestsError)
        setFriends([])
        return
      }

      if (!friendRequestsData || friendRequestsData.length === 0) {
        setFriends([])
        return
      }

      // Extract friend IDs
      const friendIds = friendRequestsData.map((fr) => (fr.sender_id === user.id ? fr.receiver_id : fr.sender_id))

      // Get profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", friendIds)

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError)
        setFriends([])
        return
      }

      if (!profilesData || profilesData.length === 0) {
        setFriends([])
        return
      }

      // Get streak data
      const { data: streaksData, error: streaksError } = await supabase
        .from("consumption_streaks")
        .select("*")
        .in("user_id", friendIds)
        .eq("public", true)

      if (streaksError) {
        console.error("Error fetching streaks:", streaksError)
        // Continue without streak data
      }

      // Combine data
      const friendsWithStreaks = profilesData.map((profile) => {
        const cigaretteStreak = streaksData?.find(
          (s) => s.user_id === profile.id && s.streak_type === "cigarettes" && profile.public_cigarette_streak,
        )

        const jointStreak = streaksData?.find(
          (s) => s.user_id === profile.id && s.streak_type === "joints" && profile.public_joint_streak,
        )

        return {
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          cigarette_streak: cigaretteStreak?.current_streak || 0,
          joint_streak: jointStreak?.current_streak || 0,
          relationship: "friend" as const,
        }
      })

      setFriends(friendsWithStreaks)
    } catch (error) {
      console.error("Error fetching friends:", error)
      setFriends([])
    }
  }

  const fetchPendingRequests = async () => {
    try {
      // Get pending friend requests where the user is the receiver
      const { data: pendingData, error: pendingError } = await supabase
        .from("friend_requests")
        .select("sender_id")
        .eq("receiver_id", user.id)
        .eq("status", "pending")

      if (pendingError) throw pendingError

      if (!pendingData || pendingData.length === 0) {
        setPendingRequests([])
        return
      }

      // Extract sender IDs
      const senderIds = pendingData.map((fr) => fr.sender_id)

      // Get profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", senderIds)

      if (profilesError) throw profilesError

      // Combine data
      const pendingRequestsWithProfiles = profilesData.map((profile) => {
        return {
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          relationship: "pending_received" as const,
        }
      })

      setPendingRequests(pendingRequestsWithProfiles)
    } catch (error) {
      console.error("Error fetching pending requests:", error)
      setPendingRequests([])
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setInitialLoading(true)
        setLoading(true)

        try {
          // Cargar datos en paralelo
          await Promise.all([fetchFriends(), fetchPendingRequests(), fetchAllUsers()])
        } catch (error) {
          console.error("Error loading data:", error)
        } finally {
          setInitialLoading(false)
          setLoading(false)
        }
      }

      loadData()
    }
  }, [user])

  // Update search results when query changes
  useEffect(() => {
    filterSearchResults()
  }, [searchQuery])

  const sendFriendRequest = async (userId: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("friend_requests").insert({
        sender_id: user.id,
        receiver_id: userId,
        status: "pending",
      })

      if (error) throw error

      // Update UI
      setSearchResults((prev) => prev.map((u) => (u.id === userId ? { ...u, relationship: "pending_sent" } : u)))
      setAllUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, relationship: "pending_sent" } : u)))

      toast({
        title: "Solicitud enviada",
        description: "Se ha enviado la solicitud de amistad",
      })
    } catch (error: any) {
      console.error("Error sending friend request:", error)
      toast({
        title: "Error al enviar solicitud",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const cancelFriendRequest = async (userId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("friend_requests")
        .delete()
        .eq("sender_id", user.id)
        .eq("receiver_id", userId)
        .eq("status", "pending")

      if (error) throw error

      // Update UI
      setSearchResults((prev) => prev.map((u) => (u.id === userId ? { ...u, relationship: "none" } : u)))
      setAllUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, relationship: "none" } : u)))

      toast({
        title: "Solicitud cancelada",
        description: "Se ha cancelado la solicitud de amistad",
      })
    } catch (error: any) {
      console.error("Error cancelling friend request:", error)
      toast({
        title: "Error al cancelar solicitud",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const respondToFriendRequest = async (userId: string, accept: boolean) => {
    if (!user) return

    try {
      if (accept) {
        // Accept the request
        const { error } = await supabase
          .from("friend_requests")
          .update({ status: "accepted" })
          .eq("sender_id", userId)
          .eq("receiver_id", user.id)
          .eq("status", "pending")

        if (error) throw error

        toast({
          title: "Solicitud aceptada",
          description: "Ahora son amigos",
        })

        // Refresh friends list
        fetchFriends()
      } else {
        // Reject the request
        const { error } = await supabase
          .from("friend_requests")
          .delete()
          .eq("sender_id", userId)
          .eq("receiver_id", user.id)
          .eq("status", "pending")

        if (error) throw error

        toast({
          title: "Solicitud rechazada",
          description: "Has rechazado la solicitud de amistad",
        })
      }

      // Remove from pending requests
      setPendingRequests((prev) => prev.filter((p) => p.id !== userId))

      // Update search results if needed
      setSearchResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, relationship: accept ? "friend" : "none" } : u)),
      )
      setAllUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, relationship: accept ? "friend" : "none" } : u)))
    } catch (error: any) {
      console.error("Error responding to friend request:", error)
      toast({
        title: `Error al ${accept ? "aceptar" : "rechazar"} solicitud`,
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const removeFriend = async (userId: string) => {
    if (!user) return

    try {
      // Delete the friend relationship (either direction)
      const { error } = await supabase
        .from("friend_requests")
        .delete()
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`,
        )
        .eq("status", "accepted")

      if (error) throw error

      // Update UI
      setFriends((prev) => prev.filter((f) => f.id !== userId))

      // Update search results if needed
      setSearchResults((prev) => prev.map((u) => (u.id === userId ? { ...u, relationship: "none" } : u)))
      setAllUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, relationship: "none" } : u)))

      toast({
        title: "Amigo eliminado",
        description: "Se ha eliminado de tu lista de amigos",
      })
    } catch (error: any) {
      console.error("Error removing friend:", error)
      toast({
        title: "Error al eliminar amigo",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Get user initials for avatar fallback
  const getUserInitials = (displayName?: string, username?: string) => {
    if (displayName) {
      return displayName.charAt(0).toUpperCase()
    }
    if (username) {
      return username.charAt(0).toUpperCase()
    }
    return "U"
  }

  if (!user || !userProfile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Cargando amigos...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Amigos</CardTitle>
        <CardDescription>Conecta con otros usuarios y ve su progreso</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Siempre mostrar el buscador, incluso durante la carga inicial */}
        <div className="flex space-x-2">
          <Input
            placeholder="Buscar usuarios por nombre o usuario"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => setActiveTab("search")} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </div>

        {initialLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="friends">
                <Users className="h-4 w-4 mr-2" />
                Amigos ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                <Clock className="h-4 w-4 mr-2" />
                Solicitudes ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="search">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No tienes amigos todavía</p>
                  <p className="text-sm">Busca usuarios para añadirlos como amigos</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab("search")}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Buscar amigos
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friends.map((friend) => (
                    <FriendCard key={friend.id} user={friend} onRemove={() => removeFriend(friend.id)} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No tienes solicitudes pendientes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={request.avatar_url || undefined} />
                              <AvatarFallback>{getUserInitials(request.display_name, request.username)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{request.display_name || request.username}</h4>
                              <p className="text-sm text-muted-foreground">@{request.username}</p>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => respondToFriendRequest(request.id, false)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Rechazar
                            </Button>
                            <Button size="sm" onClick={() => respondToFriendRequest(request.id, true)}>
                              <Check className="h-4 w-4 mr-2" />
                              Aceptar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No se encontraron usuarios</p>
                  <p className="text-sm">Intenta con otro término de búsqueda</p>
                </div>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground mb-2">
                    Mostrando {searchResults.length} {searchResults.length === 1 ? "usuario" : "usuarios"}
                    {searchQuery && <span> para "{searchQuery}"</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((userResult) => (
                      <UserSearchCard
                        key={userResult.id}
                        user={userResult}
                        onAction={() => {
                          if (userResult.relationship === "none") {
                            sendFriendRequest(userResult.id)
                          } else if (userResult.relationship === "pending_sent") {
                            cancelFriendRequest(userResult.id)
                          } else if (userResult.relationship === "friend") {
                            removeFriend(userResult.id)
                          } else if (userResult.relationship === "pending_received") {
                            respondToFriendRequest(userResult.id, true)
                          }
                        }}
                        actionType={
                          userResult.relationship === "none"
                            ? "add"
                            : userResult.relationship === "pending_sent"
                              ? "cancel"
                              : userResult.relationship === "friend"
                                ? "remove"
                                : userResult.relationship === "pending_received"
                                  ? "accept"
                                  : "add"
                        }
                      />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

// Componente simplificado para mostrar amigos
function FriendCard({
  user,
  onRemove,
}: {
  user: UserWithStreaks
  onRemove: () => void
}) {
  // Get user initials for avatar fallback
  const getUserInitials = (displayName?: string, username?: string) => {
    if (displayName) {
      return displayName.charAt(0).toUpperCase()
    }
    if (username) {
      return username.charAt(0).toUpperCase()
    }
    return "U"
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center p-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback>{getUserInitials(user.display_name, user.username)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 flex-1 min-w-0">
            <h4 className="font-medium truncate">{user.display_name || user.username}</h4>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
              {(user.cigarette_streak > 0 || user.joint_streak > 0) && (
                <div className="flex items-center space-x-1">
                  {user.cigarette_streak > 0 && (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500">
                      {user.cigarette_streak}d
                    </Badge>
                  )}
                  {user.joint_streak > 0 && (
                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500">
                      {user.joint_streak}d
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove} className="ml-2">
            <UserX className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para mostrar resultados de búsqueda
function UserSearchCard({
  user,
  onAction,
  actionType,
}: {
  user: UserWithStreaks
  onAction: () => void
  actionType: "add" | "remove" | "cancel" | "accept"
}) {
  // Get user initials for avatar fallback
  const getUserInitials = (displayName?: string, username?: string) => {
    if (displayName) {
      return displayName.charAt(0).toUpperCase()
    }
    if (username) {
      return username.charAt(0).toUpperCase()
    }
    return "U"
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center p-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback>{getUserInitials(user.display_name, user.username)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 flex-1 min-w-0">
            <h4 className="font-medium truncate">{user.display_name || user.username}</h4>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
              {(user.cigarette_streak > 0 || user.joint_streak > 0) && (
                <div className="flex items-center space-x-1">
                  {user.cigarette_streak > 0 && (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500">
                      {user.cigarette_streak}d
                    </Badge>
                  )}
                  {user.joint_streak > 0 && (
                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500">
                      {user.joint_streak}d
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          <Button
            variant={actionType === "remove" || actionType === "cancel" ? "outline" : "default"}
            size="sm"
            onClick={onAction}
            className="ml-2"
          >
            {actionType === "add" && (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Añadir
              </>
            )}
            {actionType === "remove" && (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Eliminar
              </>
            )}
            {actionType === "cancel" && (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </>
            )}
            {actionType === "accept" && (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Aceptar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
