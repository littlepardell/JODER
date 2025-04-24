"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Habit, HabitCategory } from "./habit-tracker"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, Trash2, Flame, Bell, BellOff, Clock, Tag, PauseCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface HabitDashboardProps {
  habits: Habit[]
  selectedDate: Date
  toggleHabit: (habitId: string) => void
  addHabit: (name: string, category: HabitCategory, recurringDays: number[]) => void
  removeHabit: (habitId: string) => void
  updateHabitReminder: (habitId: string, reminderTime: string, reminderEnabled: boolean) => void
  updateHabitCategory: (habitId: string, category: HabitCategory) => void
  updateHabitRecurringDays: (habitId: string, recurringDays: number[]) => void
  notificationPermission: NotificationPermission
  travelMode: boolean
  toggleHabitPaused: (habitId: string) => void
}

export default function HabitDashboard({
  habits,
  selectedDate,
  toggleHabit,
  addHabit,
  removeHabit,
  updateHabitReminder,
  updateHabitCategory,
  updateHabitRecurringDays,
  notificationPermission,
  travelMode,
  toggleHabitPaused,
}: HabitDashboardProps) {
  const [newHabitName, setNewHabitName] = useState("")
  const [newHabitCategory, setNewHabitCategory] = useState<HabitCategory>("otro")
  const [newHabitRecurringDays, setNewHabitRecurringDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [activeCategory, setActiveCategory] = useState<HabitCategory | "todas">("todas")

  const formattedDate = format(selectedDate, "yyyy-MM-dd")
  const displayDate = format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
  const currentDayOfWeek = selectedDate.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  const handleAddHabit = () => {
    if (newHabitName.trim()) {
      addHabit(newHabitName.trim(), newHabitCategory, newHabitRecurringDays)
      setNewHabitName("")
      setNewHabitCategory("otro")
      setNewHabitRecurringDays([0, 1, 2, 3, 4, 5, 6])
    }
  }

  // Calculate streak (consecutive days with all habits completed)
  const calculateStreak = () => {
    const now = new Date()
    let currentStreak = 0

    // Check each day, starting from today and going backwards
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(now)
      checkDate.setDate(now.getDate() - i)
      const dateStr = format(checkDate, "yyyy-MM-dd")
      const dayOfWeek = checkDate.getDay()

      // Get habits that should be completed on this day of the week
      const habitsForDay = habits.filter((habit) => habit.recurringDays.includes(dayOfWeek) && !habit.paused)

      // Check if all applicable habits were completed on this day
      const allCompleted = habitsForDay.length > 0 && habitsForDay.every((habit) => habit.completed[dateStr])

      if (allCompleted) {
        currentStreak++
      } else {
        // Break the streak if not all applicable habits were completed
        break
      }
    }

    return currentStreak
  }

  // Filter habits by category and day of week
  const filteredHabits = habits.filter((habit) => {
    // Filter by category
    if (activeCategory !== "todas" && habit.category !== activeCategory) {
      return false
    }

    // Filter by day of week (only show habits that should be done on the selected day)
    return habit.recurringDays.includes(currentDayOfWeek)
  })

  const streak = calculateStreak()
  const totalHabitsToday = filteredHabits.length
  const completedHabitsToday = filteredHabits.filter((habit) => habit.completed[formattedDate]).length
  const progressPercentage = totalHabitsToday > 0 ? (completedHabitsToday / totalHabitsToday) * 100 : 0

  // Calculate chain for each habit (consecutive days completed)
  const calculateHabitChain = (habit: Habit) => {
    const now = new Date()
    let chain = 0

    // Check each day, starting from today and going backwards
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(now)
      checkDate.setDate(now.getDate() - i)
      const dateStr = format(checkDate, "yyyy-MM-dd")
      const dayOfWeek = checkDate.getDay()

      // Skip days when the habit is not scheduled
      if (!habit.recurringDays.includes(dayOfWeek)) {
        continue
      }

      if (habit.completed[dateStr]) {
        chain++
      } else {
        // Break the chain if the habit was not completed on a scheduled day
        break
      }
    }

    return chain
  }

  // Get category display name and color
  const getCategoryInfo = (category: HabitCategory) => {
    switch (category) {
      case "salud":
        return { name: "Salud", color: "bg-green-500" }
      case "productividad":
        return { name: "Productividad", color: "bg-blue-500" }
      case "aprendizaje":
        return { name: "Aprendizaje", color: "bg-purple-500" }
      case "social":
        return { name: "Social", color: "bg-pink-500" }
      default:
        return { name: "Otro", color: "bg-gray-500" }
    }
  }

  // Get day name for display
  const getDayName = (day: number) => {
    const date = new Date(2023, 0, 1 + day) // January 1, 2023 was a Sunday (day 0)
    return format(date, "EEE", { locale: es })
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-lg md:text-xl font-semibold">Hábitos para {displayDate}</h2>
        <Card className="bg-gradient-to-r from-amber-500 to-red-500 text-white">
          <CardContent className="p-2 md:p-3 flex items-center space-x-2">
            <Flame className="h-4 w-4 md:h-5 md:w-5" />
            <div>
              <span className="text-base md:text-lg font-bold">{streak}</span>
              <span className="text-xs md:text-sm ml-1">días</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={activeCategory === "todas" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setActiveCategory("todas")}
        >
          Todas
        </Badge>
        <Badge
          variant={activeCategory === "salud" ? "default" : "outline"}
          className="cursor-pointer bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/20"
          onClick={() => setActiveCategory("salud")}
        >
          Salud
        </Badge>
        <Badge
          variant={activeCategory === "productividad" ? "default" : "outline"}
          className="cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border-blue-500/20"
          onClick={() => setActiveCategory("productividad")}
        >
          Productividad
        </Badge>
        <Badge
          variant={activeCategory === "aprendizaje" ? "default" : "outline"}
          className="cursor-pointer bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 border-purple-500/20"
          onClick={() => setActiveCategory("aprendizaje")}
        >
          Aprendizaje
        </Badge>
        <Badge
          variant={activeCategory === "social" ? "default" : "outline"}
          className="cursor-pointer bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 border-pink-500/20"
          onClick={() => setActiveCategory("social")}
        >
          Social
        </Badge>
        <Badge
          variant={activeCategory === "otro" ? "default" : "outline"}
          className="cursor-pointer bg-gray-500/10 hover:bg-gray-500/20 text-gray-500 border-gray-500/20"
          onClick={() => setActiveCategory("otro")}
        >
          Otro
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2.5">
        <div
          className="bg-primary h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <div className="text-sm text-muted-foreground text-right">
        {completedHabitsToday} de {totalHabitsToday} hábitos completados
      </div>

      <div className="space-y-3 md:space-y-4">
        {filteredHabits.map((habit) => {
          const habitChain = calculateHabitChain(habit)
          const categoryInfo = getCategoryInfo(habit.category)
          const isScheduledToday = habit.recurringDays.includes(currentDayOfWeek)
          const isPaused = habit.paused && travelMode

          return (
            <div
              key={habit.id}
              className={`flex items-center justify-between p-2 md:p-3 rounded-lg bg-card hover:bg-accent/50 transition-colors ${isPaused ? "opacity-50" : ""}`}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Checkbox
                  id={`habit-${habit.id}`}
                  checked={habit.completed[formattedDate] || false}
                  onCheckedChange={() => toggleHabit(habit.id)}
                  disabled={isPaused}
                />
                <div className="flex flex-col">
                  <label
                    htmlFor={`habit-${habit.id}`}
                    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate ${
                      habit.completed[formattedDate] ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {habit.name}
                    {isPaused && <span className="ml-2 text-xs">(Pausado)</span>}
                  </label>

                  <div className="flex items-center mt-1 space-x-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${categoryInfo.color}/20 text-${categoryInfo.color.replace("bg-", "")}`}
                    >
                      {categoryInfo.name}
                    </Badge>

                    {habitChain > 0 && (
                      <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20">
                        <Flame className="h-3 w-3 mr-1" />
                        {habitChain} {habitChain === 1 ? "día" : "días"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                {isToday && !isPaused && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {habit.reminderEnabled ? (
                          <Bell className="h-4 w-4 text-primary" />
                        ) : (
                          <BellOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <h4 className="font-medium">Recordatorio para {habit.name}</h4>

                        <div className="flex items-center justify-between">
                          <Label htmlFor={`reminder-${habit.id}`} className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Hora del recordatorio</span>
                          </Label>
                          <Input
                            id={`reminder-${habit.id}`}
                            type="time"
                            value={habit.reminderTime || "12:00"}
                            onChange={(e) =>
                              updateHabitReminder(habit.id, e.target.value, habit.reminderEnabled || false)
                            }
                            className="w-24"
                            disabled={notificationPermission !== "granted"}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor={`reminder-enabled-${habit.id}`} className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            <span>Activar recordatorio</span>
                          </Label>
                          <Switch
                            id={`reminder-enabled-${habit.id}`}
                            checked={habit.reminderEnabled || false}
                            onCheckedChange={(checked) =>
                              updateHabitReminder(habit.id, habit.reminderTime || "12:00", checked)
                            }
                            disabled={notificationPermission !== "granted"}
                          />
                        </div>

                        {notificationPermission !== "granted" && (
                          <p className="text-xs text-muted-foreground">
                            Debes activar las notificaciones para recibir recordatorios.
                          </p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium">Configuración de {habit.name}</h4>

                      <div className="space-y-2">
                        <Label htmlFor={`category-${habit.id}`}>Categoría</Label>
                        <Select
                          value={habit.category}
                          onValueChange={(value) => updateHabitCategory(habit.id, value as HabitCategory)}
                        >
                          <SelectTrigger id={`category-${habit.id}`}>
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="salud">Salud</SelectItem>
                            <SelectItem value="productividad">Productividad</SelectItem>
                            <SelectItem value="aprendizaje">Aprendizaje</SelectItem>
                            <SelectItem value="social">Social</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Días de la semana</Label>
                        <div className="flex flex-wrap gap-2">
                          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                            <Badge
                              key={day}
                              variant={habit.recurringDays.includes(day) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => {
                                const newDays = habit.recurringDays.includes(day)
                                  ? habit.recurringDays.filter((d) => d !== day)
                                  : [...habit.recurringDays, day].sort()
                                updateHabitRecurringDays(habit.id, newDays)
                              }}
                            >
                              {getDayName(day)}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {travelMode && (
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`paused-${habit.id}`} className="flex items-center gap-2">
                            <PauseCircle className="h-4 w-4" />
                            <span>Pausar durante viaje</span>
                          </Label>
                          <Switch
                            id={`paused-${habit.id}`}
                            checked={habit.paused}
                            onCheckedChange={() => toggleHabitPaused(habit.id)}
                          />
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará el hábito "{habit.name}" y todos sus registros.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeHabit(habit.id)}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full">
            <PlusCircle className="h-4 w-4 mr-2" />
            Añadir nuevo hábito
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir nuevo hábito</DialogTitle>
            <DialogDescription>
              Crea un nuevo hábito para seguir. Puedes configurar la categoría y los días de la semana.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="habit-name">Nombre del hábito</Label>
              <Input
                id="habit-name"
                placeholder="Ej: Meditar 10 minutos"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="habit-category">Categoría</Label>
              <Select value={newHabitCategory} onValueChange={(value) => setNewHabitCategory(value as HabitCategory)}>
                <SelectTrigger id="habit-category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salud">Salud</SelectItem>
                  <SelectItem value="productividad">Productividad</SelectItem>
                  <SelectItem value="aprendizaje">Aprendizaje</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Días de la semana</Label>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                  <Badge
                    key={day}
                    variant={newHabitRecurringDays.includes(day) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const newDays = newHabitRecurringDays.includes(day)
                        ? newHabitRecurringDays.filter((d) => d !== day)
                        : [...newHabitRecurringDays, day].sort()
                      setNewHabitRecurringDays(newDays)
                    }}
                  >
                    {getDayName(day)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleAddHabit} disabled={!newHabitName.trim()}>
              Añadir hábito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

