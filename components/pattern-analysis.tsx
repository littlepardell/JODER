"use client"

import { useState, useMemo } from "react"
import { parseISO, getDay } from "date-fns"
import type { Habit, ConsumptionRecord, HabitCategory } from "./habit-tracker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts"
import { Badge } from "@/components/ui/badge"

interface PatternAnalysisProps {
  habits: Habit[]
  consumptionRecords: ConsumptionRecord[]
}

export default function PatternAnalysis({ habits, consumptionRecords }: PatternAnalysisProps) {
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | "todas">("todas")

  // Analyze patterns by day of week
  const dayOfWeekStats = useMemo(() => {
    // Initialize data for each day of the week
    const daysOfWeek = [
      { name: "Domingo", dayIndex: 0, completed: 0, total: 0, percentage: 0, cigarettes: 0, joints: 0, count: 0 },
      { name: "Lunes", dayIndex: 1, completed: 0, total: 0, percentage: 0, cigarettes: 0, joints: 0, count: 0 },
      { name: "Martes", dayIndex: 2, completed: 0, total: 0, percentage: 0, cigarettes: 0, joints: 0, count: 0 },
      { name: "Miércoles", dayIndex: 3, completed: 0, total: 0, percentage: 0, cigarettes: 0, joints: 0, count: 0 },
      { name: "Jueves", dayIndex: 4, completed: 0, total: 0, percentage: 0, cigarettes: 0, joints: 0, count: 0 },
      { name: "Viernes", dayIndex: 5, completed: 0, total: 0, percentage: 0, cigarettes: 0, joints: 0, count: 0 },
      { name: "Sábado", dayIndex: 6, completed: 0, total: 0, percentage: 0, cigarettes: 0, joints: 0, count: 0 },
    ]

    // Count completed habits by day of week
    const allDates = new Set<string>()
    habits.forEach((habit) => {
      if (selectedCategory !== "todas" && habit.category !== selectedCategory) {
        return
      }

      Object.keys(habit.completed).forEach((dateStr) => {
        allDates.add(dateStr)
        const date = parseISO(dateStr)
        const dayOfWeek = getDay(date) // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

        // Only count if the habit is scheduled for this day
        if (habit.recurringDays.includes(dayOfWeek)) {
          daysOfWeek[dayOfWeek].total++
          if (habit.completed[dateStr]) {
            daysOfWeek[dayOfWeek].completed++
          }
        }
      })
    })

    // Count consumption by day of week
    consumptionRecords.forEach((record) => {
      const date = parseISO(record.date)
      const dayOfWeek = getDay(date)

      daysOfWeek[dayOfWeek].cigarettes += record.cigarettes
      daysOfWeek[dayOfWeek].joints += record.joints
      daysOfWeek[dayOfWeek].count++
    })

    // Calculate percentages and averages
    return daysOfWeek.map((day) => {
      const percentage = day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0
      const avgCigarettes = day.count > 0 ? Math.round((day.cigarettes / day.count) * 10) / 10 : 0
      const avgJoints = day.count > 0 ? Math.round((day.joints / day.count) * 10) / 10 : 0

      return {
        ...day,
        percentage,
        avgCigarettes,
        avgJoints,
      }
    })
  }, [habits, consumptionRecords, selectedCategory])

  // Find best and worst days
  const bestDay = useMemo(() => {
    return [...dayOfWeekStats].filter((day) => day.total > 0).sort((a, b) => b.percentage - a.percentage)[0]
  }, [dayOfWeekStats])

  const worstDay = useMemo(() => {
    return [...dayOfWeekStats].filter((day) => day.total > 0).sort((a, b) => a.percentage - b.percentage)[0]
  }, [dayOfWeekStats])

  // Get category display name
  const getCategoryName = (category: HabitCategory | "todas") => {
    switch (category) {
      case "salud":
        return "Salud"
      case "productividad":
        return "Productividad"
      case "aprendizaje":
        return "Aprendizaje"
      case "social":
        return "Social"
      case "otro":
        return "Otro"
      default:
        return "Todas las categorías"
    }
  }

  // Colors for the chart
  const dayColors = [
    "#FF5733", // Sunday
    "#33FF57", // Monday
    "#3357FF", // Tuesday
    "#F033FF", // Wednesday
    "#FF33A8", // Thursday
    "#33FFF0", // Friday
    "#FFD133", // Saturday
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Análisis de Patrones</h2>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === "todas" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory("todas")}
          >
            Todas
          </Badge>
          <Badge
            variant={selectedCategory === "salud" ? "default" : "outline"}
            className="cursor-pointer bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/20"
            onClick={() => setSelectedCategory("salud")}
          >
            Salud
          </Badge>
          <Badge
            variant={selectedCategory === "productividad" ? "default" : "outline"}
            className="cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border-blue-500/20"
            onClick={() => setSelectedCategory("productividad")}
          >
            Productividad
          </Badge>
          <Badge
            variant={selectedCategory === "aprendizaje" ? "default" : "outline"}
            className="cursor-pointer bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 border-purple-500/20"
            onClick={() => setSelectedCategory("aprendizaje")}
          >
            Aprendizaje
          </Badge>
          <Badge
            variant={selectedCategory === "social" ? "default" : "outline"}
            className="cursor-pointer bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 border-pink-500/20"
            onClick={() => setSelectedCategory("social")}
          >
            Social
          </Badge>
          <Badge
            variant={selectedCategory === "otro" ? "default" : "outline"}
            className="cursor-pointer bg-gray-500/10 hover:bg-gray-500/20 text-gray-500 border-gray-500/20"
            onClick={() => setSelectedCategory("otro")}
          >
            Otro
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bestDay && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Mejor día de la semana</CardTitle>
              <CardDescription>Para {getCategoryName(selectedCategory)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bestDay.name}</div>
              <div className="text-sm text-muted-foreground">{bestDay.percentage}% de hábitos completados</div>
            </CardContent>
          </Card>
        )}

        {worstDay && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Día más difícil</CardTitle>
              <CardDescription>Para {getCategoryName(selectedCategory)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{worstDay.name}</div>
              <div className="text-sm text-muted-foreground">{worstDay.percentage}% de hábitos completados</div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rendimiento por día de la semana</CardTitle>
          <CardDescription>Porcentaje de hábitos completados para {getCategoryName(selectedCategory)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "percentage") return [`${value}%`, "Completado"]
                    return [value, name]
                  }}
                  labelFormatter={(label) => `Día: ${label}`}
                />
                <Legend />
                <Bar dataKey="percentage" name="% Completado">
                  {dayOfWeekStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={dayColors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consumo promedio por día</CardTitle>
          <CardDescription>Cigarrillos y porros por día de la semana</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "avgCigarettes") return [value, "Cigarrillos"]
                    if (name === "avgJoints") return [value, "Porros"]
                    return [value, name]
                  }}
                  labelFormatter={(label) => `Día: ${label}`}
                />
                <Legend />
                <Bar dataKey="avgCigarettes" name="Cigarrillos" fill="#f59e0b" />
                <Bar dataKey="avgJoints" name="Porros" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

