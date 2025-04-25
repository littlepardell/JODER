"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HabitTracker } from "@/components/habit-tracker"
import { Home, User, RefreshCw } from "lucide-react"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("habits")

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    localStorage.setItem("activeTab", tab)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="habits">
            <Home className="h-4 w-4 mr-2" />
            <span>Hábitos</span>
          </TabsTrigger>
          <TabsTrigger value="stats">
            <User className="h-4 w-4 mr-2" />
            <span>Estadísticas</span>
          </TabsTrigger>
          <TabsTrigger value="patterns">
            <RefreshCw className="h-4 w-4 mr-2" />
            <span>Patrones</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="habits">
          <HabitTracker />
        </TabsContent>
      </Tabs>
    </div>
  )
}
