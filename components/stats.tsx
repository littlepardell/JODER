"use client"

import { useState, useEffect } from "react"
import { format, parseISO, startOfWeek, endOfWeek, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import type { Habit, ConsumptionRecord } from "./habit-tracker"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

interface StatsProps {
  habits: Habit[]
  consumptionRecords: ConsumptionRecord[]
  selectedDate: Date
}

export default function Stats({ habits, consumptionRecords, selectedDate }: StatsProps) {
  const [period, setPeriod] = useState<"day" | "week" | "month" | "all">("day")
  const [dailyStats, setDailyStats] = useState<any>(null)

  // Calculate stats for the selected day
  useEffect(() => {
    const dateStr = format(selectedDate, "yyyy-MM-dd")

    // Habit completion for the selected day
    const totalHabits = habits.length
    const completedHabits = habits.filter((habit) => habit.completed[dateStr]).length
    const completionPercentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0

    // Consumption for the selected day
    const record = consumptionRecords.find((r) => r.date === dateStr)
    const cigarettes = record?.cigarettes || 0
    const joints = record?.joints || 0

    // Format date for display
    const displayDate = format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })

    // Set daily stats
    setDailyStats({
      date: displayDate,
      totalHabits,
      completedHabits,
      completionPercentage,
      cigarettes,
      joints,
      habitData: [
        { name: "Completados", value: completedHabits, color: "#22c55e" },
        { name: "Pendientes", value: totalHabits - completedHabits, color: "#6b7280" },
      ],
    })

    // Set period to "day" when date changes
    setPeriod("day")
  }, [selectedDate, habits, consumptionRecords])

  // Calculate habit completion stats
  const calculateHabitStats = () => {
    // Get all dates with habit data
    const allDates = new Set<string>()
    habits.forEach((habit) => {
      Object.keys(habit.completed).forEach((date) => {
        allDates.add(date)
      })
    })

    // Filter dates based on selected period
    const filteredDates = Array.from(allDates).filter((dateStr) => {
      const date = parseISO(dateStr)
      const now = selectedDate

      if (period === "day") {
        return isSameDay(date, now)
      } else if (period === "week") {
        const weekStart = startOfWeek(now, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
        return date >= weekStart && date <= weekEnd
      } else if (period === "month") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return date >= monthStart && date <= monthEnd
      }

      // For "all", include all dates
      return true
    })

    // Calculate completion percentage for each date
    const dateStats = filteredDates.map((dateStr) => {
      const date = parseISO(dateStr)
      const totalHabits = habits.length
      const completedHabits = habits.filter((habit) => habit.completed[dateStr]).length
      const percentage = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0

      return {
        date: dateStr,
        displayDate: format(date, "dd/MM"),
        dayName: format(date, "EEE", { locale: es }),
        percentage: Math.round(percentage),
        completed: completedHabits,
        total: totalHabits,
      }
    })

    // Sort by date
    return dateStats.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // Calculate consumption stats
  const calculateConsumptionStats = () => {
    // Filter records based on selected period
    const filteredRecords = consumptionRecords.filter((record) => {
      const date = parseISO(record.date)
      const now = selectedDate

      if (period === "day") {
        return isSameDay(date, now)
      } else if (period === "week") {
        const weekStart = startOfWeek(now, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
        return date >= weekStart && date <= weekEnd
      } else if (period === "month") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return date >= monthStart && date <= monthEnd
      }

      // For "all", include all records
      return true
    })

    // Format records for chart
    const formattedRecords = filteredRecords.map((record) => {
      const date = parseISO(record.date)
      return {
        date: record.date,
        displayDate: format(date, "dd/MM"),
        dayName: format(date, "EEE", { locale: es }),
        cigarettes: record.cigarettes,
        joints: record.joints,
      }
    })

    // Sort by date
    return formattedRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // Calculate streak (consecutive days with completed habits)
  const calculateStreak = () => {
    const now = new Date()
    let currentStreak = 0
    let maxStreak = 0

    // Check each day, starting from today and going backwards
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(now)
      checkDate.setDate(now.getDate() - i)
      const dateStr = format(checkDate, "yyyy-MM-dd")

      // Check if any habits were completed on this day
      const anyCompleted = habits.some((habit) => habit.completed[dateStr])

      if (anyCompleted) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        // Break the streak if no habits were completed
        break
      }
    }

    return currentStreak
  }

  const habitStats = calculateHabitStats()
  const consumptionStats = calculateConsumptionStats()
  const currentStreak = calculateStreak()

  // Calculate overall stats
  const totalDaysTracked = new Set([
    ...habitStats.map((stat) => stat.date),
    ...consumptionStats.map((stat) => stat.date),
  ]).size

  const totalCigarettes = consumptionRecords.reduce((sum, record) => sum + record.cigarettes, 0)
  const totalJoints = consumptionRecords.reduce((sum, record) => sum + record.joints, 0)

  const averageHabitCompletion =
    habitStats.length > 0
      ? Math.round(habitStats.reduce((sum, stat) => sum + stat.percentage, 0) / habitStats.length)
      : 0

  // COLORS for pie chart
  const COLORS = ["#22c55e", "#6b7280", "#f59e0b", "#8b5cf6"]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Estadísticas</h2>
        <Tabs value={period} onValueChange={(value) => setPeriod(value as "day" | "week" | "month" | "all")}>
          <TabsList>
            <TabsTrigger value="day">Día</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mes</TabsTrigger>
            <TabsTrigger value="all">Todo</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {period === "day" && dailyStats && (
        <>
          <h3 className="text-lg font-medium">{dailyStats.date}</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Hábitos Completados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dailyStats.completedHabits} de {dailyStats.totalHabits}
                </div>
                <div className="text-sm text-muted-foreground">{dailyStats.completionPercentage}% completado</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cigarrillos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dailyStats.cigarettes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Porros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dailyStats.joints}</div>
              </CardContent>
            </Card>
          </div>

          {dailyStats.totalHabits > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Progreso de Hábitos</CardTitle>
                <CardDescription>Hábitos completados vs pendientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dailyStats.habitData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {dailyStats.habitData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(value) => [`${value} hábitos`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {period !== "day" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Racha Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentStreak} días</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Promedio de Completado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageHabitCompletion}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Días Registrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDaysTracked}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {period !== "day" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Progreso de Hábitos</CardTitle>
              <CardDescription>Porcentaje de hábitos completados por día</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {habitStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={habitStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="displayDate" tickFormatter={(value, index) => habitStats[index].dayName} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        formatter={(value, name) => [`${value}%`, "Completado"]}
                        labelFormatter={(label, data) => {
                          const item = data[0].payload
                          return `${item.dayName} ${item.displayDate}: ${item.completed}/${item.total} hábitos`
                        }}
                      />
                      <Bar dataKey="percentage" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No hay datos suficientes para mostrar
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consumo</CardTitle>
              <CardDescription>
                Total: {totalCigarettes} cigarrillos y {totalJoints} porros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {consumptionStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={consumptionStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="displayDate" tickFormatter={(value, index) => consumptionStats[index].dayName} />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => [value, name === "cigarettes" ? "Cigarrillos" : "Porros"]}
                        labelFormatter={(label, data) => {
                          const item = data[0].payload
                          return `${item.dayName} ${item.displayDate}`
                        }}
                      />
                      <Line type="monotone" dataKey="cigarettes" stroke="hsl(var(--warning))" name="Cigarrillos" />
                      <Line type="monotone" dataKey="joints" stroke="hsl(var(--secondary))" name="Porros" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No hay datos suficientes para mostrar
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

